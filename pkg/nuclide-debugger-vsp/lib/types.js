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

import type {
  DebuggerConfigAction,
  VsAdapterType,
} from 'nuclide-debugger-common';
import type {Adapter} from 'nuclide-debugger-vsps';

import * as React from 'react';

export type AutoGenPropertyPrimitiveType = 'string' | 'number' | 'boolean';

export type AutoGenPropertyType =
  | AutoGenPropertyPrimitiveType
  | 'array'
  | 'enum'
  | 'object';

export type AutoGenProperty = {
  name: string,
  type: AutoGenPropertyType,
  itemType?: AutoGenPropertyPrimitiveType,
  description: string,
  defaultValue?: string | number | boolean,
  required: boolean,
  visible: boolean,
  enums?: string[],
  enumsDefaultValue?: string,
};

export type AutoGenLaunchConfig = {|
  // Disjoint Union Flag
  launch: true,
  // General Properties
  properties: AutoGenProperty[],
  header?: React.Node,
  threads: boolean,
  vsAdapterType: VsAdapterType,
  adapterType: Adapter,
  // Launch Specific Properties
  scriptPropertyName: string,
  cwdPropertyName: ?string,
  scriptExtension: string,
|};

export type AutoGenAttachConfig = {|
  // Disjoint Union Flag
  launch: false,
  // General Properties
  properties: AutoGenProperty[],
  header?: React.Node,
  threads: boolean,
  vsAdapterType: VsAdapterType,
  adapterType: Adapter,
  // Attach Specific Properties
|};

export type AutoGenLaunchOrAttachConfig =
  | AutoGenLaunchConfig
  | AutoGenAttachConfig;

export type AutoGenConfig = {|
  launch: ?AutoGenLaunchConfig,
  attach: ?AutoGenAttachConfig,
|};

export type LaunchAttachProviderIsEnabled = (
  action: DebuggerConfigAction,
  config: AutoGenConfig,
) => Promise<boolean>;

// Subsets of https://git.io/vbhTr.
export type ReactNativeAttachArgs = {
  program: string,
  outDir: string,
  port: number,
  sourceMaps: boolean,
  sourceMapPathOverrides?: Object,
};

export type ReactNativeLaunchArgs = ReactNativeAttachArgs & {
  platform: 'android' | 'ios',
  variant?: string,
  target?: 'device' | 'simulator',
  runArguments?: Array<string>,
  env?: Object,
};
