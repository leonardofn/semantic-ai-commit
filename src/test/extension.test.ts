import assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	suite('Activation', () => {
		test('should register commands on activation', () => {
			const context = { subscriptions: [] } as any;
			myExtension.activate(context);

			assert.strictEqual(context.subscriptions.length, 2);
			// Verificar se são disposables (comandos registrados)
			assert(context.subscriptions[0].dispose);
			assert(context.subscriptions[1].dispose);
		});
	});

	suite('Utility Functions', () => {
		test('removerMarkdown should clean bold and italic', () => {
			// Access the internal function through the module
			const removerMarkdown = (myExtension as any).removerMarkdown;
			const input = '**bold** and *italic* text';
			const result = removerMarkdown(input);
			assert.strictEqual(result, 'bold and italic text');
		});

		test('removerMarkdown should handle code blocks', () => {
			const removerMarkdown = (myExtension as any).removerMarkdown;
			const input = 'Here is `code` and ```block```';
			const result = removerMarkdown(input);
			assert.strictEqual(result, 'Here is code and block');
		});

		test('removerMarkdown should handle links', () => {
			const removerMarkdown = (myExtension as any).removerMarkdown;
			const input = '[link](url)';
			const result = removerMarkdown(input);
			assert.strictEqual(result, 'link');
		});

		test('removerMarkdown should handle headers', () => {
			const removerMarkdown = (myExtension as any).removerMarkdown;
			const input = '# Header\n## Subheader';
			const result = removerMarkdown(input);
			assert.strictEqual(result, 'Header\nSubheader');
		});

		test('removerMarkdown should handle lists', () => {
			const removerMarkdown = (myExtension as any).removerMarkdown;
			const input = '- item1\n* item2\n1. item3';
			const result = removerMarkdown(input);
			assert.strictEqual(result, 'item1\nitem2\nitem3');
		});
	});
});
