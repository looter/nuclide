/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {LRUCache} from 'lru-cache';
import type {NuclideUri} from 'nuclide-commons/nuclideUri';
import type {DirectorySearchConfig, FileSearchResult} from './rpc-types';

import LRU from 'lru-cache';
import {
  fileSearchForDirectory,
  getExistingSearchDirectories,
  disposeSearchForDirectory,
} from './FileSearchProcess';
import fsPromise from 'nuclide-commons/fsPromise';
import {getLogger} from 'log4js';

const searchConfigCache: LRUCache<
  NuclideUri,
  Promise<DirectorySearchConfig>,
> = LRU({
  // In practice, we expect this cache to have one entry for each item in
  // `atom.project.getPaths()`. We do not expect this number to be particularly
  // large, so we add a bit of a buffer and log an error if we actually fill the
  // cache.
  max: 25,
  dispose(key: NuclideUri, value: Promise<DirectorySearchConfig>) {
    getLogger('FuzzyFileSearchService').error(
      `Unexpected eviction of ${key} from the searchConfigCache.`,
    );
  },
});

const getSearchConfig = (function() {
  try {
    // $FlowFB
    return require('./fb-custom-file-search').getSearchConfig;
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }

    return function(directory: NuclideUri): Promise<DirectorySearchConfig> {
      return Promise.resolve({useCustomSearch: false});
    };
  }
})();

/**
 * Performs a fuzzy file search in the specified directory.
 */
export async function queryFuzzyFile(config: {|
  rootDirectory: NuclideUri,
  queryRoot?: NuclideUri,
  queryString: string,
  ignoredNames: Array<string>,
  smartCase?: boolean,
|}): Promise<Array<FileSearchResult>> {
  let searchConfigPromise = searchConfigCache.get(config.rootDirectory);
  if (searchConfigPromise == null) {
    searchConfigPromise = getSearchConfig(config.rootDirectory);
    searchConfigCache.set(config.rootDirectory, searchConfigPromise);
  }
  const searchConfig = await searchConfigPromise;
  if (searchConfig.useCustomSearch) {
    return searchConfig.search(config.queryString, config.rootDirectory);
  } else {
    const search = await fileSearchForDirectory(
      config.rootDirectory,
      config.ignoredNames,
    );
    return search.query(config.queryString, {
      queryRoot: config.queryRoot,
      smartCase: config.smartCase,
    });
  }
}

export async function queryAllExistingFuzzyFile(
  queryString: string,
  ignoredNames: Array<string>,
): Promise<Array<FileSearchResult>> {
  const directories = getExistingSearchDirectories();
  const aggregateResults = await Promise.all(
    directories.map(rootDirectory =>
      queryFuzzyFile({
        ignoredNames,
        queryString,
        rootDirectory,
      }),
    ),
  );
  // Optimize for the common case.
  if (aggregateResults.length === 1) {
    return aggregateResults[0];
  } else {
    return [].concat(...aggregateResults).sort((a, b) => b.score - a.score);
  }
}

/**
 * @return whether this service can perform fuzzy file queries on the
 *   specified directory.
 */
export function isFuzzySearchAvailableFor(
  rootDirectory: NuclideUri,
): Promise<boolean> {
  return fsPromise.exists(rootDirectory);
}

/**
 * This should be called when the directory is removed from Atom.
 */
export function disposeFuzzySearch(rootDirectory: NuclideUri): Promise<void> {
  return disposeSearchForDirectory(rootDirectory);
}
