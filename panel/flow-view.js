"use strict";
(function() {
	Editor.polymerElement({
		listeners: {
			mousedown: "_onMouseDown",
			mousewheel: "_onMouseWheel",
			mousemove: "_onMouseMove",
			mouseleave: "_onMouseLeave",
			keydown: "_onKeyDown",
			keyup: "_onKeyUp"
		},
		properties: {
			scale: {
				type: Number,
				value: 1
			},
			mode: {
				type: String,
				value: ""
			}
		},
		_policy: null,
		ready: function() {
			var i = [ 0, 1, 1 ],
				e = [ 0, 1, 1 ];
			this.$.grid.setScaleH([ 5, 2 ], 100, 1000), this.$.grid.setMappingH( i[ 0 ], i[ 1 ], i[ 2 ] ), this.$.grid.setScaleV([ 5, 2 ], 100, 1000), this.$.grid.setMappingV( e[ 0 ], e[ 1 ], e[ 2 ] ), this.$.grid.setAnchor( .5, .5 ), this.addEventListener("mousedown", this._onCaptureMousedown.bind( this ), !0 ), this.$.editButtons.addEventListener("mousedown", function( i ) {
				return i.stopPropagation();
			});
		},
		_T: function( i ) {
			return Editor.T( i );
		},
		detached: function() {
			clearInterval( this._initTimer );
		},
		init: function() {
			var i = this;
			this._initTimer = setInterval(function() {
				var e = i.getBoundingClientRect();
				0 === e.width && 0 === e.height || (clearInterval( i._initTimer ), cc.engine.isInitialized ? (i.fire("engine-ready"), i.fire("flow-view-ready"), i._resize()) : i._initEngine(function() {
					i.$.gizmosView.sceneToPixel = i.sceneToPixel.bind( i ), i.$.gizmosView.worldToPixel = i.worldToPixel.bind( i ), i.$.gizmosView.pixelToScene = i.pixelToScene.bind( i ), i.$.gizmosView.pixelToWorld = i.pixelToWorld.bind( i ), i._resize();
				}));

				var n = i.$.grid.xDirection * i.$.grid.xAxisOffset;
				var t = i.$.grid.yDirection * i.$.grid.yAxisOffset;

				i.$.graph.style.transform = "matrix(" +
					i.$.grid.xAxisScale + ", 0, 0, " +
					i.$.grid.yAxisScale + ", " +
					(n - 0.5 * i.$.graph.offsetWidth + 0.5 * i.$.grid.xAxisScale * i.$.graph.offsetWidth) + ", " +
					(t - 0.5 * i.$.graph.offsetHeight + 0.5 * i.$.grid.yAxisScale * i.$.graph.offsetHeight) + ")";
			}, 100 );
			var e = cc.ContainerStrategy.extend({
				apply: function( i, e ) {
					var t, n, o = i._frameSize.width,
						s = i._frameSize.height,
						r = cc.container.style,
						c = e.width,
						d = e.height,
						a = o / c,
						h = s / d;
					h > a ? (t = o, n = d * a) : (t = c * h, n = s);
					var l = Math.round( (o - t) / 2 ),
						g = Math.round( (s - n) / 2 );
					t = o - 2 * l, n = s - 2 * g, this._setupContainer( i, t, n ), r.margin = "0";
				}
			});
			this._policy = new cc.ResolutionPolicy( new e, cc.ContentStrategy.SHOW_ALL );
		},
		initPosition: function( i, e, t ) {
			this.scale = t;
			this.$.grid.xAxisSync( i, t );
			this.$.grid.yAxisSync( e, t );
			this.$.grid.repaint();
			this.$.gizmosView.scale = t;
			/*
			var n = [ "_position", "_rotationX", "_rotationY", "_scaleX", "_scaleY", "_skewX", "_skewY" ];
			n.forEach(function( i ) {
				var e = cc.Class.attr( cc.Scene, i );
				e = cc.js.addon({
					serializable: !1
				}, e ), cc.Class.attr( cc.Scene.prototype, i, e );
			});
			var o = cc.director.getScene();
			o.scale = cc.v2( this.$.grid.xAxisScale, this.$.grid.yAxisScale ), o.setPosition( cc.v2( this.$.grid.xDirection * this.$.grid.xAxisOffset, this.$.grid.yDirection * this.$.grid.yAxisOffset ) ), cc.engine.repaintInEditMode();
			*/
		},
		_resize: function() {
			var i = this.getBoundingClientRect();
			if ( (0 !== i.width || 0 !== i.height) && (this.$.grid.resize(), this.$.grid.repaint(), this.$.gizmosView.resize(), cc.engine.isInitialized) ) {
/*
				var e = cc.director.getScene();
				e && (cc.view.setCanvasSize( i.width, i.height ), cc.view.setDesignResolutionSize( i.width, i.height, this._policy || cc.ResolutionPolicy.SHOW_ALL ), e.scale = cc.v2( this.$.grid.xAxisScale, this.$.grid.yAxisScale ), e.setPosition( cc.v2( this.$.grid.xDirection * this.$.grid.xAxisOffset, this.$.grid.yDirection * this.$.grid.yAxisOffset ) ), cc.engine.repaintInEditMode());
*/
			}
		},
		_initEngine: function( i ) {
			var e = this,
				t = this.$[ "engine-canvas" ],
				n = this.getBoundingClientRect();
			t.width = n.width, t.height = n.height;
			var o = Editor.remote._projectProfile,
				s = {
					id: "engine-canvas",
					width: n.width,
					height: n.height,
					designWidth: n.width,
					designHeight: n.height,
					groupList: o[ "group-list" ],
					collisionMatrix: o[ "collision-matrix" ]
				};
			cc.engine.init( s, function() {
				e.fire("engine-ready"), _Scene.initScene(function( t ) {
					return t ? void e.fire("flow-view-init-error", t ) : (e.fire("flow-view-ready"), void(i && i()));
				});
			});
		},
		adjustToCenter: function( i, e ) {
			var t, n, o, s;
			if ( e ) {
				o = e.width, s = e.height, t = e.x, n = e.y;
			} else {
				var r = cc.engine.getDesignResolutionSize();
				o = r.width, s = r.height, t = 0, n = 0;
			}
			var c, d = this.getBoundingClientRect(),
				a = d.width - 2 * i,
				h = d.height - 2 * i;
			if ( a >= o && h >= s ) {
				c = 1;
			} else {
				var l = Editor.Utils.fitSize( o, s, a, h );
				c = l[ 0 ] < l[ 1 ] ? l[ 0 ] / o : l[ 1 ] / s, o = l[ 0 ], s = l[ 1 ];
			}
			this.initPosition( this.$.grid.xDirection * ((d.width - o) / 2 - t * c), this.$.grid.yDirection * ((d.height - s) / 2 - n * c), c );
		},
		sceneToPixel: function( i ) {
			return cc.v2( this.$.grid.valueToPixelH( i.x ), this.$.grid.valueToPixelV( i.y ) );
		},
		worldToPixel: function( i ) {
			var e = cc.director.getScene(),
				t = e.convertToNodeSpaceAR( i );
			return this.sceneToPixel( t );
		},
		pixelToScene: function( i ) {
			return cc.v2( this.$.grid.pixelToValueH( i.x ), this.$.grid.pixelToValueV( i.y ) );
		},
		pixelToWorld: function( i ) {
			var e = cc.director.getScene();
			return cc.v2( e.convertToWorldSpaceAR( this.pixelToScene( i ) ) );
		},
		_onCaptureMousedown: function( i ) {
			var e = this;
			return 3 === i.which || 2 === i.which || this.movingGraph ? (i.stopPropagation(), this.style.cursor = "-webkit-grabbing", void Editor.UI.DomUtils.startDrag("-webkit-grabbing", i, function( i, t, n ) {
				e.$.grid.pan( t, n ), e.$.grid.repaint();

				var n = e.$.grid.xDirection * e.$.grid.xAxisOffset;
				var t = e.$.grid.yDirection * e.$.grid.yAxisOffset;

				e.$.graph.style.transform = "matrix(" +
					e.$.grid.xAxisScale + ", 0, 0, " +
					e.$.grid.yAxisScale + ", " +
					Math.round(n - 0.5 * e.$.graph.offsetWidth + 0.5 * e.$.grid.xAxisScale * e.$.graph.offsetWidth) + ", " +
					Math.round(t - 0.5 * e.$.graph.offsetHeight + 0.5 * e.$.grid.yAxisScale * e.$.graph.offsetHeight) + ")";
/*
				var o = cc.director.getScene();
				o.setPosition( cc.v2( e.$.grid.xDirection * e.$.grid.xAxisOffset, e.$.grid.yDirection * e.$.grid.yAxisOffset ) ), cc.engine.repaintInEditMode();
*/
			}, function( i ) {
				i.shiftKey ? e.style.cursor = "-webkit-grab" : e.style.cursor = "";
			})) : void 0;
		},
		_onMouseDown: function( i ) {
			if ( i.stopPropagation(), 1 === i.which ) {
				var e = !1,
					t = Editor.Selection.curSelection("node");
				(i.metaKey || i.ctrlKey) && (e = !0);
				var b = this.getBoundingClientRect();
				var n = i.clientX - b.left,
					o = i.clientY - b.top;
				// Editor.log(n, o);

				Editor.UI.DomUtils.startDrag("default", i, function( i, s, r, c, d ) {
					var a = c * c + d * d;
					if ( !(4 > a) ) {
						var h = n,
							l = o;
						0 > c && (h += c, c = -c), 0 > d && (l += d, d = -d), this.$.gizmosView.updateSelectRect( h, l, c, d );
						var g, u, f = _Scene.rectHitTest( h, l, c, d );
						if ( e ) {
							for ( u = t.slice(), g = 0; g < f.length; ++g ) {
								-1 === u.indexOf( f[ g ].uuid ) && u.push( f[ g ].uuid );
							}
						} else {
							for ( u = [], g = 0; g < f.length; ++g ) {
								u.push( f[ g ].uuid );
							}
						}
						Editor.Selection.select("node", u, !0, !1 );
					}
				}.bind( this ), function( i, s, r, c, d ) {
					var a = c * c + d * d;
					if ( 4 > a ) {
						var h = _Scene.hitTest( n, o );
						e ? h && (-1 === t.indexOf( h.uuid ) ? Editor.Selection.select("node", h.uuid, !1, !0 ) : Editor.Selection.unselect("node", h.uuid, !0 )) : h ? Editor.Selection.select("node", h.uuid, !0, !0 ) : Editor.Selection.clear("node");
					} else {
						Editor.Selection.confirm(), this.$.gizmosView.fadeoutSelectRect();
					}
				}.bind( this ) );
			}
		},
		_onMouseWheel: function( i ) {
			i.stopPropagation();

			var e = Editor.Utils.smoothScale( this.scale, i.wheelDelta );
			e = Editor.Math.clamp( e, this.$.grid.hticks.minValueScale, this.$.grid.hticks.maxValueScale );
			this.scale = e;

			var b = this.getBoundingClientRect();
			this.$.grid.xAxisScaleAt( i.clientX - b.left, e );
			this.$.grid.yAxisScaleAt( i.clientY - b.top, e );
			this.$.grid.repaint();
			this.$.gizmosView.scale = e;

			var n = this.$.grid.xDirection * this.$.grid.xAxisOffset;
			var t = this.$.grid.yDirection * this.$.grid.yAxisOffset;

			this.$.graph.style.transform = "matrix(" +
				this.$.grid.xAxisScale + ", 0, 0, " +
				this.$.grid.yAxisScale + ", " +
				(n + 0.5 * this.$.graph.offsetWidth * (this.$.grid.xAxisScale - 1)) + ", " +
				(t + 0.5 * this.$.graph.offsetHeight * (this.$.grid.yAxisScale - 1)) + ")";

/*
			var t = cc.director.getScene();
			t.scale = cc.v2( this.$.grid.xAxisScale, this.$.grid.yAxisScale ), t.setPosition( cc.v2( this.$.grid.xDirection * this.$.grid.xAxisOffset, this.$.grid.yDirection * this.$.grid.yAxisOffset ) ), cc.engine.repaintInEditMode();
*/
		},
		_onMouseMove: function( i ) {
			if ( i.stopPropagation(), !this.movingGraph ) {
				// Editor.log( i.offsetX, i.offsetY );
/*
				var e = _Scene.hitTest( i.offsetX, i.offsetY ),
					t = e ? e.uuid : null;
				Editor.Selection.hover("node", t );
*/
			}
		},
		_onMouseLeave: function() {
//			Editor.Selection.hover("node", null );
		},
		_onKeyDown: function( i ) {
			i.stopPropagation(), "space" === Editor.KeyCode( i.which ) && (this.style.cursor = "-webkit-grab", this.movingGraph = !0);
		},
		_onKeyUp: function( i ) {
			i.stopPropagation(), "space" === Editor.KeyCode( i.which ) && (this.style.cursor = "", this.movingGraph = !1);
		},
		_inEditMode: function( i ) {
			return "" !== i;
		},
		_editModeIcon: function( i ) {
			return i ? Editor.url("packages://flow/icon/" + i + ".png") : "";
		},
		_onSaveEditMode: function() {
//			_Scene.EditMode.save();
		},
		_onCloseEditMode: function() {
//			_Scene.EditMode.pop();
		}
	});
})();
