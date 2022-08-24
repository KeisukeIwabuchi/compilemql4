'use strict';

import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as util from 'util';
import * as pathModule from 'path';

export class CompileMQL4 {
  private compileFile(path: string): void {
    let outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel("MetaEditor");
    let configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('compilemql4');
    let fileName: string = pathModule.basename(path);
    let logFile: string = this.getLogFileName(path, fileName);

    if (this.checkExclude(fileName) === false) {
        return;
    }

    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine('start compile...');

    if (configuration.metaeditorDir.length === 0 ||
      configuration.metaeditorDir === undefined) {
      outputChannel.appendLine('Please input parameter \'metaeditorDir\'.');
      return;
    }

    // execute compile command
    let command = this.createCommand(path, logFile);
    outputChannel.appendLine(command);

    childProcess.exec(command, (error, stdout, stderror) => {
      outputChannel.appendLine(stdout);
      outputChannel.appendLine(stderror);
      const readFile = util.promisify(fs.readFile);
      readFile(logFile, 'ucs-2')
        .then((data) => {
          outputChannel.appendLine(this.deleteBom(data));
        })
        .catch((err) => {
          throw err;
        });
    });
  }

  private getLogFileName(path: string, fileName: string): string {
    let conf = vscode.workspace.getConfiguration('compilemql4');
    return (conf.logDir.length > 0) ? 
      conf.logDir :
      path.replace(fileName, 'compilemql4.log');
  }

  private createCommand(path: string, logFile: string): string {
    let command: string = '';
    let configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('compilemql4');
    
    // wine command path
    if (configuration.wineCommandPath.length > 0) {
      command += configuration.wineCommandPath + ' ';
    }

    // compile setting
    command += '"' + configuration.metaeditorDir + '"';
    command += ' /compile:"' + path + '"';

    // include setting
    if (configuration.includeDir.length > 0) {
      command += ' /include:"' + configuration.includeDir + '"';
    }

    // log setting
    command += ' /log';
    command += ':"' + logFile + '"';

    return command;
  }

  private checkExclude (filename: string): boolean {
    let extension: string = pathModule.parse(filename).ext;
    return extension === '.mq4' || extension === '.mqh' || extension === '.mq5';
  }

  private deleteBom (str: string): string {
    return (str.charCodeAt(0) === 0xFEFF) ? str.slice(1) : str;
  }

  public OnSave(document: vscode.TextDocument): void {
    try {
      let configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('compilemql4');

      if (configuration.compileAfterSave === true) {
        this.compileFile(document.fileName);
      }
    }
    catch (e) {
      vscode.window.showErrorMessage('CompileMQL4: could not generate ex4 file: ' + e);
    }
  }

  public CompileFileFromCommand(): void {
    let ed: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    if (ed !== undefined) {
      this.compileFile(ed.document.fileName);
    }
  }
}