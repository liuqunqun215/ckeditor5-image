/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import VirtualTestEditor from 'tests/core/_utils/virtualtesteditor.js';
import ImageStyleEngine from 'ckeditor5/image/imagestyle/imagestyleengine.js';
import ImageEngine from 'ckeditor5/image/imageengine.js';
import ImageStyleCommand from 'ckeditor5/image/imagestyle/imagestylecommand.js';
import { getData as getModelData, setData as setModelData } from 'ckeditor5/engine/dev-utils/model.js';
import { getData as getViewData } from 'ckeditor5/engine/dev-utils/view.js';

describe( 'ImageStyleEngine', () => {
	let editor, document, viewDocument;

	beforeEach( () => {
		return VirtualTestEditor.create( {
			plugins: [ ImageStyleEngine ],
			image: {
				styles: [
					{ name: 'fullStyle', title: 'foo', icon: 'object-center', value: null },
					{ name: 'sideStyle', title: 'bar', icon: 'object-right', value: 'side', className: 'side-class' },
					{ name: 'dummyStyle', title: 'baz', icon: 'object-dummy', value: 'dummy', className: 'dummy-class' }
				]
			}
		} )
			.then( newEditor => {
				editor = newEditor;
				document = editor.document;
				viewDocument = editor.editing.view;
			} );
	} );

	it( 'should be loaded', () => {
		expect( editor.plugins.get( ImageStyleEngine ) ).to.be.instanceOf( ImageStyleEngine );
	} );

	it( 'should load image engine', () => {
		expect( editor.plugins.get( ImageEngine ) ).to.be.instanceOf( ImageEngine );
	} );

	it( 'should set schema rules for image style', () => {
		const schema = document.schema;

		expect( schema.check( { name: 'image', attributes: [ 'imageStyle', 'src' ], inside: '$root' } ) ).to.be.true;
	} );

	it( 'should register command', () => {
		expect( editor.commands.has( 'imagestyle' ) ).to.be.true;
		const command = editor.commands.get( 'imagestyle' );

		expect( command ).to.be.instanceOf( ImageStyleCommand );
	} );

	it( 'should convert from view to model', () => {
		editor.setData( '<figure class="image side-class"><img src="foo.png" /></figure>' );

		expect( getModelData( document, { withoutSelection: true } ) ).to.equal( '<image imageStyle="side" src="foo.png"></image>' );
	} );

	it( 'should not convert from view to model if class is not defined', () => {
		editor.setData( '<figure class="image foo-bar"><img src="foo.png" /></figure>' );

		expect( getModelData( document, { withoutSelection: true } ) ).to.equal( '<image src="foo.png"></image>' );
	} );

	it( 'should not convert from view to model when not in image figure', () => {
		editor.setData( '<figure class="side-class"></figure>'  );

		expect( getModelData( document, { withoutSelection: true } ) ).to.equal( '' );
	} );

	it( 'should not convert from view to model if schema prevents it', () => {
		document.schema.disallow( { name: 'image', attributes: 'imageStyle' } );
		editor.setData( '<figure class="image side-class"><img src="foo.png" /></figure>' );

		expect( getModelData( document, { withoutSelection: true } ) ).to.equal( '<image src="foo.png"></image>' );
	} );

	it( 'should convert model to view: adding attribute', () => {
		setModelData( document, '<image src="foo.png"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', 'side' );
		} );

		expect( editor.getData() ).to.equal( '<figure class="image side-class"><img src="foo.png"></figure>' );
	} );

	it( 'should convert model to view: removing attribute', () => {
		setModelData( document, '<image src="foo.png" imageStyle="side"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', null );
		} );

		expect( editor.getData() ).to.equal( '<figure class="image"><img src="foo.png"></figure>' );
	} );

	it( 'should convert model to view: change attribute', () => {
		setModelData( document, '<image src="foo.png" imageStyle="dummy"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', 'side' );
		} );

		expect( editor.getData() ).to.equal( '<figure class="image side-class"><img src="foo.png"></figure>' );
	} );

	it( 'should not convert from model to view if already consumed: adding attribute', () => {
		editor.editing.modelToView.on( 'addAttribute:imageStyle', ( evt, data, consumable ) => {
			consumable.consume( data.item, 'addAttribute:imageStyle' );
		}, { priority: 'high' } );

		setModelData( document, '<image src="foo.png"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', 'side' );
		} );

		expect( getViewData( viewDocument, { withoutSelection: true } ) ).to.equal(
			'<figure class="image ck-widget" contenteditable="false"><img src="foo.png"></img></figure>'
		);
	} );

	it( 'should not convert from model to view if already consumed: removing attribute', () => {
		editor.editing.modelToView.on( 'removeAttribute:imageStyle', ( evt, data, consumable ) => {
			consumable.consume( data.item, 'removeAttribute:imageStyle' );
		}, { priority: 'high' } );

		setModelData( document, '<image src="foo.png" imageStyle="side"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', null );
		} );

		expect( getViewData( viewDocument, { withoutSelection: true } ) ).to.equal(
			'<figure class="image ck-widget side-class" contenteditable="false"><img src="foo.png"></img></figure>'
		);
	} );

	it( 'should not convert from model to view if already consumed: change attribute', () => {
		editor.editing.modelToView.on( 'changeAttribute:imageStyle', ( evt, data, consumable ) => {
			consumable.consume( data.item, 'changeAttribute:imageStyle' );
		}, { priority: 'high' } );

		setModelData( document, '<image src="foo.png" imageStyle="dummy"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', 'side' );
		} );

		expect( getViewData( viewDocument, { withoutSelection: true } ) ).to.equal(
			'<figure class="image ck-widget dummy-class" contenteditable="false"><img src="foo.png"></img></figure>'
		);
	} );

	it( 'should not convert from model to view if style is not present: adding attribute', () => {
		setModelData( document, '<image src="foo.png"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', 'foo' );
		} );

		expect( editor.getData() ).to.equal( '<figure class="image"><img src="foo.png"></figure>' );
	} );

	it( 'should not convert from model to view if style is not present: change attribute', () => {
		setModelData( document, '<image src="foo.png" imageStyle="dummy"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', 'foo' );
		} );

		expect( editor.getData() ).to.equal( '<figure class="image"><img src="foo.png"></figure>' );
	} );

	it( 'should not convert from model to view if style is not present: remove attribute', () => {
		setModelData( document, '<image src="foo.png" imageStyle="foo"></image>' );
		const image = document.getRoot().getChild( 0 );
		const batch = document.batch();

		document.enqueueChanges( () => {
			batch.setAttribute( image, 'imageStyle', null );
		} );

		expect( editor.getData() ).to.equal( '<figure class="image"><img src="foo.png"></figure>' );
	} );
} );
