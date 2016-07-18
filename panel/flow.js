"use strict";
(function() {
	var e = require("electron"),
		n = require("fire-url");
	Editor.polymerPanel("flow", {
		behaviors: [ Editor.UI.Droppable ],
		hostAttributes: {
			droppable: "asset"
		},
		listeners: {
			"drop-area-enter": "_onDropAreaEnter",
			"drop-area-leave": "_onDropAreaLeave",
			"drop-area-accept": "_onDropAreaAccept",
			"engine-ready": "_onEngineReady",
			"flow-view-ready": "_onSceneViewReady",
			"flow-view-init-error": "_onSceneViewInitError",
			"panel-show": "_onPanelResize",
			"panel-resize": "_onPanelResize",
			"panel-copy": "_onPanelCopy",
			"panel-paste": "_onPanelPaste"
		},
		properties: {
			itemPath: {
				type: String,
				"default": ""
			}
		},
		created: function() {
			this._viewReady = !1, this._ipcList = [], this._copyingIds = null, this._pastingId = "", console.time("flow:reloading"), Editor.Ipc.sendToAll("flow:reloading");
		},
		run: function( e ) {
			var n = this;
			if ( e && e.uuid ) {
				var c = this.confirmCloseScene();
				switch ( c ) {
					case 0:
						return void _Scene.saveScene(function() {
							n._loadScene( e.uuid );
						});
					case 1:
						return;
					case 2:
						return void this._loadScene( e.uuid );
				}
			}
		},
		ready: function() {
			this._initDroppable( this.$.dropArea ), _Scene.init(), /* Polymer.dom( this.$.border ).insertBefore( _Scene.view, this.$.loader ), this.$.flowView = _Scene.view, */ this.$.flowView.init(), e.ipcRenderer.on("editor:panel-undock", function( e ) {
				"flow" === e && _Scene.EngineEvents.unregister();
			});

			var shaderGraph = this.$.flowView.shaderGraph();
			var preview = this.$.preview;
			//*
			var menu = this.$["context-menu"];

			menu.onItemSelected = function(name) {
				var pos = menu.getPosition();
				shaderGraph.addNode({
					type: name,
					pos: [pos.x, pos.y]
				});
			};

			menu.onToggleOff = function() {
				shaderGraph.clearTempConnection();
			};
			//*/

			// Update the shader when the preview is loaded
			preview.onload = function(){
				// Build the context menu from the list of available nodes
				var nodeTypes = shaderGraph.nodeList();
				menu.buildMenu(nodeTypes);

				//shaderGraph.loadGraph(demos[1]);
				//shaderGraph.updateShader();
			};

			shaderGraph.onShaderUpdate = function(shader){
				var shaderDef = shader.buildShader()

				/*
				var source = document.getElementById("source");
				source.innerHTML = ShaderGraph.Beautify(
					optimize_glsl(shaderDef.fshader(), "2", "fs"),
					//shaderDef.fshader(),
					{
						"indent_size": 1,
						"indent_char": '\t',
						"max_preserve_newlines": -1,
						"brace_style": "expand",
						"wrap_line_length": 0
					}
				);

				source.classList.remove("prettyprinted");
				prettyPrint();
				*/

				preview.updateShader(shaderDef);
			};

			shaderGraph.onConnectionReleased = function(e) {
				menu.toggleMenuOn();
				menu.positionMenu(e);
				return false;
			};
			
			//*
			var demos = [
				{ name: "Color",
					nodes: [
						{type:"fragColor", pos:[650, 130]},
						{type:"vec4", pos:[100, 100], value:[1,0,0,1]}
					],
					links: [
						[1, 0]
					]
				},
				{ name: "Pattern",
					nodes: [
						{type:"fragColor", pos:[650, 130]},
						{type:"value", pos:[0, 0], value:70},
						{type:"uv", pos:[0, 100]},
						{type:"value", pos:[0, 220], value:35},
						{type:"value", pos:[0, 320], value:0.5},
						{type:"multiply", pos:[200, 50]},
						{type:"multiply", pos:[200, 150]},
						{type:"cos", pos:[350, 50]},
						{type:"sin", pos:[350, 150]},
						{type:"join", pos:[500, 100]},
						{type:"value", pos:[320, 250], value: 1}
					],
					links: [
						[1, 5],
						[2.1, 5.1],
						[2.2, 6],
						[3, 6.1],
						[5, 7],
						[6, 8],
						[7, 9],
						[8, 9.1],
						[4, 9.2],
						[10, 9.3],
						[9, 0]
					]
				},
				{ name: "Black and White",
					nodes: [
						{type:"fragColor", pos:[660, 200]},
						{type:"texture", pos:[0, 0]},
						{type:"split", pos:[0, 170]},
						{type:"add", pos:[135, 90]},
						{type:"add", pos:[267, 90]},
						{type:"divide", pos:[400, 90]},
						{type:"value", pos:[250, 175], value:3},
						{type:"join", pos:[530, 170]}
					],
					links: [
						[1, 2],
						[2, 3],
						[2.1, 3.1],
						[3, 4],
						[2.2, 4.1],
						[4, 5],
						[6, 5.1],
						[5, 7],
						[5, 7.1],
						[5, 7.2],
						[2.3, 7.3],
						[7, 0]
					]
				}
			];
			//*/

			/*
			var placeholder = document.getElementById("demos");

			var element = document.createElement("a");
			element.onclick = function() {
				shaderGraph.clearGraph();
			};
			element.innerHTML = "Clear";
			element.className = "demo";
			element.style.color = "red";
			placeholder.appendChild(element);

			for (var i = 0; i < demos.length; i++) {
				var element = document.createElement("a");
				element.demo = demos[i];
				element.onclick = function() {
					shaderGraph.loadGraph(this.demo);
				};
				element.innerHTML = element.demo.name;
				element.className = "demo";
				placeholder.appendChild(element);
			}
			*/
		},
		close: function() {
			var e = this.confirmCloseScene();
			switch ( e ) {
				case 0:
					return _Scene.saveScene(), Editor.Selection.clear("node"), !0;
				case 1:
					return Editor.remote._runDashboard = !1, !1;
				case 2:
					return Editor.Selection.clear("node"), !0;
			}
		},
		_onPanelResize: function() {
			var e = this;
			this._resizeDebounceID || (this._resizeDebounceID = setTimeout(function() {
				e._resizeDebounceID = null, /* _Scene.view._resize() */ e.$.flowView._resize();
			}, 10 ));
		},
		deleteCurrentSelected: function( e ) {
			e && e.stopPropagation();
			var n = Editor.Selection.curSelection("node");
			_Scene.deleteNodes( n );
		},
		duplicateCurrentSelected: function( e ) {
			e && e.stopPropagation();
			var n = Editor.Selection.curSelection("node");
			_Scene.duplicateNodes( n );
		},
		confirmCloseScene: function() {
			var e = 1 === _Scene.EditMode.close();
			if ( e ) {
				return 1;
			}
			var c = _Scene.Undo.dirty();
			if ( c ) {
				var t = "New Scene",
					o = "db://assets/New Scene.fire",
					i = Editor.remote.currentSceneUuid;
				return i && (o = Editor.assetdb.remote.uuidToUrl( i ), t = n.basename( o )), Editor.Dialog.messageBox({
					type: "warning",
					buttons: [ Editor.T("MESSAGE.save"), Editor.T("MESSAGE.cancel"), Editor.T("MESSAGE.dont_save") ],
					title: Editor.T("MESSAGE.scene.save_confirm_title"),
					message: Editor.T("MESSAGE.scene.save_confirm_message", {
						name: t
					}),
					detail: Editor.T("MESSAGE.scene.save_confirm_detail"),
					defaultId: 0,
					cancelId: 1,
					noLink: !0
				});
			}
			return 2;
		},
		_onPanelCopy: function() {
			var e = Editor.Selection.curSelection("node");
			_Scene.copyNodes( e );
		},
		_onPanelPaste: function() {
			var e = Editor.Selection.curActivate("node");
			_Scene.pasteNodes( e );
		},
		_onDropAreaEnter: function( e ) {
			e.stopPropagation();
		},
		_onDropAreaLeave: function( e ) {
			e.stopPropagation();
		},
		_onDropAreaAccept: function( e ) {
			e.stopPropagation();
			var n = "true" === e.detail.dataTransfer.getData("unlinkPrefab"),
				c = e.detail.dragItems,
				t = e.detail.offsetX,
				o = e.detail.offsetY;
			_Scene.createNodesAt( c, t, o, {
				unlinkPrefab: n
			});
		},
		_onDragOver: function( e ) {
			if ( _Scene.AnimUtils._recording ) {
				return void Editor.UI.DragDrop.allowDrop( e.dataTransfer, !1 );
			}
			var n = Editor.UI.DragDrop.type( e.dataTransfer );
			return "asset" !== n ? void Editor.UI.DragDrop.allowDrop( e.dataTransfer, !1 ) : (e.preventDefault(), e.stopPropagation(), Editor.UI.DragDrop.allowDrop( e.dataTransfer, !0 ), void Editor.UI.DragDrop.updateDropEffect( e.dataTransfer, "copy"));
		},
		_onEngineReady: function() {
			_Scene.EngineEvents.register();
		},
		_onSceneViewReady: function() {
			this._viewReady = !0, this.$.loader.hidden = !0, _Scene.Undo.clear(), Editor.Ipc.sendToAll("flow:ready"), console.timeEnd("flow:reloading");
		},
		_onSceneViewInitError: function( e ) {
			var n = e.args[ 0 ];
			Editor.failed("Failed to init scene: " + n.stack ), this.$.loader.hidden = !0;
		},
		_loadScene: function( e ) {
			var n = this;
			this.$.loader.hidden = !1, Editor.Ipc.sendToAll("flow:reloading"), _Scene.loadSceneByUuid( e, function( e ) {
				return e ? void n.fire("flow-view-init-error", e ) : void n.fire("flow-view-ready");
			});
		},
		_newScene: function() {
			var e = this;
			this.$.loader.hidden = !1, Editor.Ipc.sendToAll("flow:reloading"), _Scene.newScene(function() {
				e.fire("flow-view-ready");
			});
		},
		_onAlignTop: function() {
			_Scene.alignSelection("top");
		},
		_onAlignVCenter: function() {
			_Scene.alignSelection("v-center");
		},
		_onAlignBottom: function() {
			_Scene.alignSelection("bottom");
		},
		_onAlignLeft: function() {
			_Scene.alignSelection("left");
		},
		_onAlignHCenter: function() {
			_Scene.alignSelection("h-center");
		},
		_onAlignRight: function() {
			_Scene.alignSelection("right");
		},
		messages: {
			"editor:dragstart": function() {
				this.$.dropArea.hidden = !1;
			},
			"editor:dragend": function() {
				this.$.dropArea.hidden = !0;
			},
			"editor:start-recording": function() {
				_Scene.AnimUtils._recording || _Scene.EditMode.push("animation", {
					callFromMessage: !0
				});
			},
			"editor:stop-recording": function( e, n ) {
				_Scene.AnimUtils._recording && _Scene.EditMode.pop({
					callFromMessage: !0,
					closeResult: n
				});
			},
			"editor:project-profile-updated": function( e, n ) {
				_Scene.projectProfileUpdated( n );
			},
			"flow:query-group-list": function( e ) {
				e.reply && e.reply( null, cc.game.groupList );
			},
			"flow:is-ready": function( e ) {
				e.reply( null, this._viewReady );
			},
			"flow:new-scene": function() {
				var e = this,
					n = this.confirmCloseScene();
				switch ( n ) {
					case 0:
						return void _Scene.saveScene(function() {
							e._newScene();
						});
					case 1:
						return;
					case 2:
						return void this._newScene();
				}
			},
			"flow:play-on-device": function() {
				_Scene.stashScene(function() {
					Editor.Ipc.sendToMain("app:play-on-device");
				});
			},
			"flow:reload-on-device": function() {
				_Scene.stashScene(function() {
					Editor.Ipc.sendToMain("app:reload-on-device");
				});
			},
			"flow:preview-server-scene-stashed": function() {
				_Scene.stashScene(function() {
					Editor.Ipc.sendToMain("app:preview-server-scene-stashed");
				});
			},
			"flow:query-hierarchy": function( e ) {
				if ( !cc.engine.isInitialized ) {
					return void e.reply( null, "", []);
				}
				var n = _Scene.dumpHierarchy(),
					c = _Scene.currentScene().uuid;
				e.reply( null, c, n );
			},
			"flow:query-nodes-by-comp-name": function( e, n ) {
				var c = cc.director.getScene(),
					t = [],
					o = cc.js.getClassByName( n );
				o && _Scene.walk( c, !1, function( e ) {
					e.getComponent( o ) && t.push( e.uuid );
				}), e.reply( null, t );
			},
			"flow:query-node": function( e, n, c ) {
				if ( e.reply ) {
					var t = _Scene.dumpNode( n );
					return t = JSON.stringify( t ), void e.reply( null, t );
				}
				var o = _Scene.dumpNode( c );
				o = JSON.stringify( o ), Editor.Ipc.sendToWins("flow:reply-query-node", n, o );
			},
			"flow:query-node-info": function( e, n, c ) {
				var t = null,
					o = cc.engine.getInstanceById( n );
				o && (t = o instanceof cc.Component ? o.node : o);
				var i = null;
				t && "cc.Node" !== c && (i = t.getComponent( cc.js._getClassById( c ) )), e.reply( null, {
					name: t ? t.name : "",
					missed: null === o,
					nodeID: t ? t.uuid : null,
					compID: i ? i.uuid : null
				});
			},
			"flow:query-node-functions": function( e, n ) {
				var c = cc.engine.getInstanceById( n ),
					t = Editor.getNodeFunctions( c );
				e.reply( null, t );
			},
			"flow:query-animation-node": function( e, n ) {
				var c = _Scene.AnimUtils.getAnimationNodeDump( n );
				e.reply( null, c );
			},
			"flow:is-child-class-of": function( e, n, c ) {
				var t = cc.js._getClassById( n ),
					o = cc.js._getClassById( c ),
					i = cc.isChildClassOf( t, o );
				e.reply( null, i );
			},
			"flow:reset-node": function( e, n ) {
				var c = cc.engine.getInstanceById( n );
				c && (_Scene.Undo.recordNode( c.uuid, "Reset Node"), _Scene.resetNode( c ), _Scene.Undo.commit());
			},
			"flow:reset-all": function( e, n ) {
				var c = cc.engine.getInstanceById( n );
				if ( c ) {
					_Scene.Undo.recordNode( c.uuid, "Reset All"), _Scene.resetNode( c );
					for ( var t = 0; t < c._components.length; ++t ) {
						_Scene.resetComponent( c._components[ t ] );
					}
					_Scene.Undo.commit();
				}
			},
			"flow:new-property": function( e, n ) {
				_Scene.newProperty( n.id, n.path, n.type );
			},
			"flow:reset-property": function( e, n ) {
				_Scene.resetProperty( n.id, n.path, n.type );
			},
			"flow:set-property": function( e, n ) {
				_Scene.setProperty( n );
			},
			"flow:has-copied-component": function( e ) {
				var n = !1,
					c = _Scene.clipboard.data;
				c instanceof cc.Component && (n = !0), e.reply( null, n );
			},
			"flow:add-component": function( e, n, c ) {
				Editor.Ipc.sendToMain("metrics:track-event", {
					category: "Scene",
					action: "Component Add",
					label: c
				}), _Scene.addComponent( n, c );
			},
			"flow:remove-component": function( e, n, c ) {
				_Scene.removeComponent( n, c );
			},
			"flow:move-up-component": function( e, n, c ) {
				var t = cc.engine.getInstanceById( n ),
					o = cc.engine.getInstanceById( c );
				if ( t && o ) {
					var i = t._components.indexOf( o );
					if ( !(0 >= i) ) {
						var r = i - 1;
						t._components.splice( i, 1 ), t._components.splice( r, 0, o );
					}
				}
			},
			"flow:move-down-component": function( e, n, c ) {
				var t = cc.engine.getInstanceById( n ),
					o = cc.engine.getInstanceById( c );
				if ( t && o ) {
					var i = t._components.indexOf( o );
					if ( !(i >= t._components.length) ) {
						var r = i + 1;
						t._components.splice( i, 1 ), t._components.splice( r, 0, o );
					}
				}
			},
			"flow:reset-component": function( e, n, c ) {
				var t = cc.engine.getInstanceById( c );
				t && (_Scene.Undo.recordNode( n, "Reset Component"), _Scene.resetComponent( t ), _Scene.Undo.commit());
			},
			"flow:copy-component": function( e, n ) {
				_Scene.copyComponent( n );
			},
			"flow:paste-component": function( e, n ) {
				_Scene.pasteComponent( n );
			},
			"flow:create-nodes-by-uuids": function( e, n, c, t ) {
				_Scene.createNodes( n, c, t );
			},
			"flow:create-node-by-classid": function( e, n, c, t, o ) {
				Editor.Ipc.sendToMain("metrics:track-event", {
					category: "Scene",
					action: "Node Prefab Add",
					label: "Empty"
				}), _Scene.createNodeByClassID( n, c, t, o );
			},
			"flow:create-node-by-prefab": function( e, n, c, t, o ) {
				Editor.Ipc.sendToMain("metrics:track-event", {
					category: "Scene",
					action: "Node Prefab Add",
					label: n.replace("New ", "")
				}), _Scene.createNodeByPrefab( n, c, t, o );
			},
			"flow:move-nodes": function( e, n, c, t ) {
				_Scene.moveNodes( n, c, t );
			},
			"flow:delete-nodes": function( e, n ) {
				_Scene.deleteNodes( n );
			},
			"flow:copy-nodes": function( e, n ) {
				_Scene.copyNodes( n );
			},
			"flow:paste-nodes": function( e, n ) {
				_Scene.pasteNodes( n );
			},
			"flow:duplicate-nodes": function( e, n ) {
				_Scene.duplicateNodes( n );
			},
			"flow:stash-and-reload": function() {
				var e = this;
				_Scene.stashScene(function() {
					e.reload();
				});
			},
			"flow:soft-reload": function( e, n ) {
				_Scene.softReload( n );
			},
			"flow:center-nodes": function( e, n ) {
				_Scene.ajustSceneToNodes( n );
			},
			"flow:create-prefab": function( e, n, c ) {
				_Scene.createPrefab( n, c );
			},
			"flow:apply-prefab": function( e, n ) {
				_Scene.applyPrefab( n );
			},
			"flow:revert-prefab": function( e, n ) {
				_Scene.revertPrefab( n );
			},
			"flow:break-prefab-instance": function() {
				var e = Editor.Selection.curSelection("node");
				_Scene.breakPrefabInstance( e );
			},
			"flow:enter-prefab-edit-mode": function( e, n ) {
				_Scene.EditMode.push("prefab", n );
			},
			"flow:stash-and-save": function() {
				_Scene.save();
			},
			"flow:saved": function() {
				_Scene.Undo.save();
			},
			"flow:undo": function() {
				_Scene.Undo.undo();
			},
			"flow:redo": function() {
				_Scene.Undo.redo();
			},
			"flow:undo-record": function( e, n, c ) {
				_Scene.Undo.recordObject( n, c );
			},
			"flow:undo-commit": function() {
				_Scene.Undo.commit();
			},
			"flow:undo-cancel": function() {
				_Scene.Undo.cancel();
			},
			"flow:animation-state-changed": function( e, n ) {
				_Scene.AnimUtils.setCurrentPlayState( n );
			},
			"flow:query-animation-time": function( e, n ) {
				var c = _Scene.AnimUtils.getAnimationTime( n );
				e.reply( null, c );
			},
			"flow:animation-time-changed": function( e, n ) {
				_Scene.AnimUtils.setAnimationTime( n );
			},
			"flow:animation-clip-changed": function( e, n ) {
				_Scene.AnimUtils.updateClip( n );
			},
			"flow:new-clip": function( e, n ) {
				_Scene.AnimUtils.addClip( n );
			},
			"flow:animation-current-clip-changed": function( e, n ) {
				_Scene.AnimUtils.changeCurrentClip( n );
			},
			"flow:save-clip": function() {
				_Scene.AnimUtils.save();
			},
			"flow:set-animation-speed": function( e, n ) {
				_Scene.AnimUtils.setSpeed( n );
			},
			"flow:export-particle-plist": function( e, n ) {
				_Scene.PariticleUtils.exportParticlePlist( n );
			},
			"flow:print-simulator-log": function( e, n ) {
				_Scene.printSimulatorLog( n );
			},
			"flow:exchange-spriteframes": function( e ) { // eslint-disable-line no-unused-vars
				_Scene.exchangeSpriteFrames();
			},
			"selection:selected": function( e, n, c ) {
				"node" === n && _Scene.select( c );
			},
			"selection:unselected": function( e, n, c ) {
				"node" === n && _Scene.unselect( c );
			},
			"selection:activated": function( e, n, c ) {
				"node" === n && c && (_Scene.activate( c ), this.itemPath = _Scene.getNodePath( c ));
			},
			"selection:deactivated": function( e, n, c ) {
				"node" === n && _Scene.deactivate( c );
			},
			"selection:hoverin": function( e, n, c ) {
				"node" === n && _Scene.hoverin( c );
			},
			"selection:hoverout": function( e, n, c ) {
				"node" === n && _Scene.hoverout( c );
			},
			"asset-db:asset-changed": function( e, n ) {
				_Scene.assetChanged( n );
			},
			"asset-db:assets-moved": function( e, n ) {
				_Scene.assetsMoved( n );
			}
		}
	});
})();
