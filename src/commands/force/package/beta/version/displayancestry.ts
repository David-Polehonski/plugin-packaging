/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { PackageAncestry, PackageAncestryNodeData } from '@salesforce/packaging';

// Import i18n messages
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_displayancestry');

export class PackageVersionDisplayAncestryCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('cliDescription');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);
  public static readonly showProgress = false;
  public static readonly varargs = false;
  public static readonly requiresDevhubUsername = true;
  public static readonly requiresProject = true;

  public static readonly flagsConfig: FlagsConfig = {
    // --json is configured automatically
    package: flags.string({
      char: 'p',
      description: messages.getMessage('package'),
      longDescription: messages.getMessage('packageLong'),
      required: true,
    }),
    dotcode: flags.boolean({
      description: messages.getMessage('dotcode'),
      longDescription: messages.getMessage('dotcodeLong'),
    }),
    verbose: flags.builtin({
      description: messages.getMessage('verbose'),
      longDescription: messages.getMessage('verboseLong'),
    }),
  };

  public async run(): Promise<PackageAncestryNodeData | string> {
    const packageAncestry = await PackageAncestry.create({
      packageId: this.flags.package as string,
      project: this.project,
      connection: this.hubOrg.getConnection(),
    });
    const jsonProducer = await packageAncestry.getJsonProducer();
    if (this.flags.dotcode) {
      const dotProducer = await packageAncestry.getDotProducer();
      const dotCodeResult: string = dotProducer.produce() as string;
      if (this.flags.json) {
        return dotCodeResult;
      } else {
        this.ux.log(dotCodeResult);
      }
    } else {
      if (packageAncestry.requestedPackageId.startsWith('04t')) {
        const paths = await packageAncestry.getLeafPathToRoot(packageAncestry.requestedPackageId);
        this.ux.log(`${paths[0].map((p) => p.getVersion()).join(' -> ')} (root)`);
        this.ux.log();
      }
      const treeProducer = await packageAncestry.getTreeProducer(!!this.flags.verbose);
      if (!this.flags.json) {
        treeProducer.produce();
      }
    }
    return jsonProducer.produce() as PackageAncestryNodeData;
  }
}
