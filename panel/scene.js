"use strict";
(function() {
    var e = require("electron"),
        n = require("fire-url");
    Editor.polymerPanel("scene", {
        behaviors: [ Editor.UI.Droppable ],
        hostAttributes: {
            droppable: "asset"
        },
        listeners: {
            "drop-area-enter": "_onDropAreaEnter",
            "drop-area-leave": "_onDropAreaLeave",
            "drop-area-accept": "_onDropAreaAccept",
            "engine-ready": "_onEngineReady",
            "scene-view-ready": "_onSceneViewReady",
            "scene-view-init-error": "_onSceneViewInitError",
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
            this._viewReady = !1, this._ipcList = [], this._copyingIds = null, this._pastingId = "", console.time("scene:reloading"), Editor.Ipc.sendToAll("scene:reloading");
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
            this._initDroppable( this.$.dropArea ), _Scene.init(), Polymer.dom( this.$.border ).insertBefore( _Scene.view, this.$.loader ), this.$.sceneView = _Scene.view, this.$.sceneView.init(), e.ipcRenderer.on("editor:panel-undock", function( e ) {
                "scene" === e && _Scene.EngineEvents.unregister();
            });
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
                e._resizeDebounceID = null, _Scene.view._resize();
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
            this._viewReady = !0, this.$.loader.hidden = !0, _Scene.Undo.clear(), Editor.Ipc.sendToAll("scene:ready"), console.timeEnd("scene:reloading");
        },
        _onSceneViewInitError: function( e ) {
            var n = e.args[ 0 ];
            Editor.failed("Failed to init scene: " + n.stack ), this.$.loader.hidden = !0;
        },
        _loadScene: function( e ) {
            var n = this;
            this.$.loader.hidden = !1, Editor.Ipc.sendToAll("scene:reloading"), _Scene.loadSceneByUuid( e, function( e ) {
                return e ? void n.fire("scene-view-init-error", e ) : void n.fire("scene-view-ready");
            });
        },
        _newScene: function() {
            var e = this;
            this.$.loader.hidden = !1, Editor.Ipc.sendToAll("scene:reloading"), _Scene.newScene(function() {
                e.fire("scene-view-ready");
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
            "scene:query-group-list": function( e ) {
                e.reply && e.reply( null, cc.game.groupList );
            },
            "scene:is-ready": function( e ) {
                e.reply( null, this._viewReady );
            },
            "scene:new-scene": function() {
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
            "scene:play-on-device": function() {
                _Scene.stashScene(function() {
                    Editor.Ipc.sendToMain("app:play-on-device");
                });
            },
            "scene:reload-on-device": function() {
                _Scene.stashScene(function() {
                    Editor.Ipc.sendToMain("app:reload-on-device");
                });
            },
            "scene:preview-server-scene-stashed": function() {
                _Scene.stashScene(function() {
                    Editor.Ipc.sendToMain("app:preview-server-scene-stashed");
                });
            },
            "scene:query-hierarchy": function( e ) {
                if ( !cc.engine.isInitialized ) {
					return void e.reply( null, "", []);
				}
                var n = _Scene.dumpHierarchy(),
                    c = _Scene.currentScene().uuid;
                e.reply( null, c, n );
            },
            "scene:query-nodes-by-comp-name": function( e, n ) {
                var c = cc.director.getScene(),
                    t = [],
                    o = cc.js.getClassByName( n );
                o && _Scene.walk( c, !1, function( e ) {
                    e.getComponent( o ) && t.push( e.uuid );
                }), e.reply( null, t );
            },
            "scene:query-node": function( e, n, c ) {
                if ( e.reply ) {
                    var t = _Scene.dumpNode( n );
                    return t = JSON.stringify( t ), void e.reply( null, t );
                }
                var o = _Scene.dumpNode( c );
                o = JSON.stringify( o ), Editor.Ipc.sendToWins("scene:reply-query-node", n, o );
            },
            "scene:query-node-info": function( e, n, c ) {
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
            "scene:query-node-functions": function( e, n ) {
                var c = cc.engine.getInstanceById( n ),
                    t = Editor.getNodeFunctions( c );
                e.reply( null, t );
            },
            "scene:query-animation-node": function( e, n ) {
                var c = _Scene.AnimUtils.getAnimationNodeDump( n );
                e.reply( null, c );
            },
            "scene:is-child-class-of": function( e, n, c ) {
                var t = cc.js._getClassById( n ),
                    o = cc.js._getClassById( c ),
                    i = cc.isChildClassOf( t, o );
                e.reply( null, i );
            },
            "scene:reset-node": function( e, n ) {
                var c = cc.engine.getInstanceById( n );
                c && (_Scene.Undo.recordNode( c.uuid, "Reset Node"), _Scene.resetNode( c ), _Scene.Undo.commit());
            },
            "scene:reset-all": function( e, n ) {
                var c = cc.engine.getInstanceById( n );
                if ( c ) {
                    _Scene.Undo.recordNode( c.uuid, "Reset All"), _Scene.resetNode( c );
                    for ( var t = 0; t < c._components.length; ++t ) {
						_Scene.resetComponent( c._components[ t ] );
					}
                    _Scene.Undo.commit();
                }
            },
            "scene:new-property": function( e, n ) {
                _Scene.newProperty( n.id, n.path, n.type );
            },
            "scene:reset-property": function( e, n ) {
                _Scene.resetProperty( n.id, n.path, n.type );
            },
            "scene:set-property": function( e, n ) {
                _Scene.setProperty( n );
            },
            "scene:has-copied-component": function( e ) {
                var n = !1,
                    c = _Scene.clipboard.data;
                c instanceof cc.Component && (n = !0), e.reply( null, n );
            },
            "scene:add-component": function( e, n, c ) {
                Editor.Ipc.sendToMain("metrics:track-event", {
                    category: "Scene",
                    action: "Component Add",
                    label: c
                }), _Scene.addComponent( n, c );
            },
            "scene:remove-component": function( e, n, c ) {
                _Scene.removeComponent( n, c );
            },
            "scene:move-up-component": function( e, n, c ) {
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
            "scene:move-down-component": function( e, n, c ) {
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
            "scene:reset-component": function( e, n, c ) {
                var t = cc.engine.getInstanceById( c );
                t && (_Scene.Undo.recordNode( n, "Reset Component"), _Scene.resetComponent( t ), _Scene.Undo.commit());
            },
            "scene:copy-component": function( e, n ) {
                _Scene.copyComponent( n );
            },
            "scene:paste-component": function( e, n ) {
                _Scene.pasteComponent( n );
            },
            "scene:create-nodes-by-uuids": function( e, n, c, t ) {
                _Scene.createNodes( n, c, t );
            },
            "scene:create-node-by-classid": function( e, n, c, t, o ) {
                Editor.Ipc.sendToMain("metrics:track-event", {
                    category: "Scene",
                    action: "Node Prefab Add",
                    label: "Empty"
                }), _Scene.createNodeByClassID( n, c, t, o );
            },
            "scene:create-node-by-prefab": function( e, n, c, t, o ) {
                Editor.Ipc.sendToMain("metrics:track-event", {
                    category: "Scene",
                    action: "Node Prefab Add",
                    label: n.replace("New ", "")
                }), _Scene.createNodeByPrefab( n, c, t, o );
            },
            "scene:move-nodes": function( e, n, c, t ) {
                _Scene.moveNodes( n, c, t );
            },
            "scene:delete-nodes": function( e, n ) {
                _Scene.deleteNodes( n );
            },
            "scene:copy-nodes": function( e, n ) {
                _Scene.copyNodes( n );
            },
            "scene:paste-nodes": function( e, n ) {
                _Scene.pasteNodes( n );
            },
            "scene:duplicate-nodes": function( e, n ) {
                _Scene.duplicateNodes( n );
            },
            "scene:stash-and-reload": function() {
                var e = this;
                _Scene.stashScene(function() {
                    e.reload();
                });
            },
            "scene:soft-reload": function( e, n ) {
                _Scene.softReload( n );
            },
            "scene:center-nodes": function( e, n ) {
                _Scene.ajustSceneToNodes( n );
            },
            "scene:create-prefab": function( e, n, c ) {
                _Scene.createPrefab( n, c );
            },
            "scene:apply-prefab": function( e, n ) {
                _Scene.applyPrefab( n );
            },
            "scene:revert-prefab": function( e, n ) {
                _Scene.revertPrefab( n );
            },
            "scene:break-prefab-instance": function() {
                var e = Editor.Selection.curSelection("node");
                _Scene.breakPrefabInstance( e );
            },
            "scene:enter-prefab-edit-mode": function( e, n ) {
                _Scene.EditMode.push("prefab", n );
            },
            "scene:stash-and-save": function() {
                _Scene.save();
            },
            "scene:saved": function() {
                _Scene.Undo.save();
            },
            "scene:undo": function() {
                _Scene.Undo.undo();
            },
            "scene:redo": function() {
                _Scene.Undo.redo();
            },
            "scene:undo-record": function( e, n, c ) {
                _Scene.Undo.recordObject( n, c );
            },
            "scene:undo-commit": function() {
                _Scene.Undo.commit();
            },
            "scene:undo-cancel": function() {
                _Scene.Undo.cancel();
            },
            "scene:animation-state-changed": function( e, n ) {
                _Scene.AnimUtils.setCurrentPlayState( n );
            },
            "scene:query-animation-time": function( e, n ) {
                var c = _Scene.AnimUtils.getAnimationTime( n );
                e.reply( null, c );
            },
            "scene:animation-time-changed": function( e, n ) {
                _Scene.AnimUtils.setAnimationTime( n );
            },
            "scene:animation-clip-changed": function( e, n ) {
                _Scene.AnimUtils.updateClip( n );
            },
            "scene:new-clip": function( e, n ) {
                _Scene.AnimUtils.addClip( n );
            },
            "scene:animation-current-clip-changed": function( e, n ) {
                _Scene.AnimUtils.changeCurrentClip( n );
            },
            "scene:save-clip": function() {
                _Scene.AnimUtils.save();
            },
            "scene:set-animation-speed": function( e, n ) {
                _Scene.AnimUtils.setSpeed( n );
            },
            "scene:export-particle-plist": function( e, n ) {
                _Scene.PariticleUtils.exportParticlePlist( n );
            },
            "scene:print-simulator-log": function( e, n ) {
                _Scene.printSimulatorLog( n );
            },
            "scene:exchange-spriteframes": function( e ) { // eslint-disable-line no-unused-vars
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
