'use strict';

import * as vscode from 'vscode';
import { CompileMQL4 } from './compileMQL4';

export function activate(context: vscode.ExtensionContext) {
    let extension = new CompileMQL4();

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
