/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { Package, PackageSaveResult } from '@salesforce/packaging';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_delete');

export class PackageDeleteCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('cliDescription');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);
  public static readonly requiresDevhubUsername = true;
  public static readonly requiresProject = true;
  public static readonly flagsConfig: FlagsConfig = {
    noprompt: flags.boolean({
      char: 'n',
      description: messages.getMessage('noPrompt'),
      longDescription: messages.getMessage('noPromptLong'),
    }),
    package: flags.string({
      char: 'p',
      description: messages.getMessage('package'),
      longDescription: messages.getMessage('packageLong'),
      required: true,
    }),
    undelete: flags.boolean({
      description: messages.getMessage('undelete'),
      longDescription: messages.getMessage('undeleteLong'),
      hidden: true,
      default: false,
    }),
  };

  public async run(): Promise<PackageSaveResult> {
    const promptMsg = this.flags.undelete ? 'promptUndelete' : 'promptDelete';
    const accepted =
      this.flags.noprompt || this.flags.json ? true : await this.ux.confirm(messages.getMessage(promptMsg));
    if (!accepted) {
      throw messages.createError('promptDeleteDeny');
    }

    const pkg = new Package({
      connection: this.hubOrg.getConnection(),
      project: this.project,
      packageAliasOrId: this.flags.package as string,
    });
    const result = this.flags.undelete ? await pkg.undelete() : await pkg.delete();
    this.display(result);
    return result;
  }

  private display(result: PackageSaveResult): void {
    const message = messages.getMessage(this.flags.undelete ? 'humanSuccessUndelete' : 'humanSuccess', [result.id]);
    this.ux.log();
    this.ux.log(message);
  }
}
