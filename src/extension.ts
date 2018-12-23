'use strict';

import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as util from 'util';
import * as pathModule from 'path';

var CompileMql4Extension = function () {
    var outputChannel: vscode.OutputChannel;

    outputChannel = vscode.window.createOutputChannel("MetaEditor");

    function compileFile(path: string): void {
        let configuration: vscode.WorkspaceConfiguration;
        let logFile: string;
        let command: string;

        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine('start compile...');

        configuration = vscode.workspace.getConfiguration('compilemql4');

        if (configuration.metaeditorDir.length === 0 ||
            configuration.metaeditorDir === undefined) {
            outputChannel.appendLine('Please input parameter \'metaeditorDir\'.');
            return;
        }

        // compile setting
        command = '"' + configuration.metaeditorDir + '"';
        command += ' /compile:"' + path + '"';

        // include setting
        if (configuration.includeDir.length > 0) {
            command += ' /include:"' + configuration.includeDir + '"';
        }

        // log setting
        logFile = (configuration.logDir.length > 0) ? 
            configuration.logDir :
            path.replace(pathModule.basename(path), 'compilemql4.log');
        command += ' /log';
        command += ':"' + logFile + '"';

        // execute compile command
        childProcess.exec(command, (error, stdout, stderror) => {
            const readFile = util.promisify(fs.readFile);
            readFile(logFile, 'ucs-2')
                .then((data) => {
                    outputChannel.appendLine(deleteBom(data));
                })
                .catch((err) => {
                    throw err;
                });
        });
    }

    function deleteBom (str: string): string {
        return (str.charCodeAt(0) === 0xFEFF) ? str.slice(1) : str;
    }

    return {
        OnSave: function (document: vscode.TextDocument) {
            try {
                let configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('compilemql4');

                if (configuration.compileAfterSave === true) {
                    compileFile(document.fileName);
                }
            }
            catch (e) {
                vscode.window.showErrorMessage('CompileMQL4: could not generate ex4 file: ' + e);
            }
        },
        CompileFileFromCommand: function () {
            let ed: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
            if (ed !== undefined) {
                compileFile(ed.document.fileName);
            }
        }
    };
};

export function activate(context: vscode.ExtensionContext) {
    let extension = CompileMql4Extension();

    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        extension.OnSave(document);
    });

    let disposable: vscode.Disposable = vscode.commands
        .registerCommand('compilemql4.compileFile', () => {
            extension.CompileFileFromCommand();
        });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
