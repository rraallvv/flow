"use strict";
(function() {
	Editor.polymerElement({
		listeners: {
			mousedown: "_onMouseDown",
			mouseup: "_onMouseUp",
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
		shaderGraph: function() {
			return this.$.graph;
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

				var s = i.$.grid.xAxisScale;
				var r = i.$.grid.yAxisScale;
				var n = i.$.grid.xDirection * i.$.grid.xAxisOffset;
				var t = i.$.grid.yDirection * i.$.grid.yAxisOffset;

				i.$.graph.setTransform( s, r, n, t );

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
		},
		_resize: function() {
			var i = this.getBoundingClientRect();
			if (0 !== i.width || 0 !== i.height) {
				this.$.grid.resize();
				this.$.grid.repaint();
				this.$.graph.resize(i.width, i.height);
				this.$.gizmosView.resize();
				this.zoomAll();
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
			if (i.target.id !== "canvas" &&
					i.target.id !== "graph" &&
					i.target.id !== "svg") {
				return;
			}
			var e = this;
			return 3 === i.which || 2 === i.which || this.movingGraph ? (i.stopPropagation(), this.style.cursor = "-webkit-grabbing", void Editor.UI.DomUtils.startDrag("-webkit-grabbing", i, function( i, t, n ) {
				e.$.grid.pan( t, n );
				e.$.grid.repaint();

				var s = e.$.grid.xAxisScale;
				var r = e.$.grid.yAxisScale;
				var t = e.$.grid.xDirection * e.$.grid.xAxisOffset;
				var n = e.$.grid.yDirection * e.$.grid.yAxisOffset;

				e.$.graph.setTransform( s, r, t, n );

			}, function( i ) {
				i.shiftKey ? e.style.cursor = "-webkit-grab" : e.style.cursor = "";
			})) : void 0;
		},
		_onMouseDown: function( i ) {
			if (i.target.id !== "canvas" &&
					i.target.id !== "graph" &&
					i.target.id !== "svg") {
				return;
			}
			this.didDragSelectionRect = false;
			this.selecting = true;
		},
		_onMouseUp: function( i ) {
			this.selecting = false;
			if (!this.didDragSelectionRect) {
				this.$.graph.updateSelectRect();
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

			var s = this.$.grid.xAxisScale;
			var r = this.$.grid.yAxisScale;
			var t = this.$.grid.xDirection * this.$.grid.xAxisOffset;
			var n = this.$.grid.yDirection * this.$.grid.yAxisOffset;

			this.$.graph.setTransform( s, r, t, n );
		},
		_onMouseMove: function( i ) {
			if (i.which === 1 && this.selecting) {
				i.stopPropagation();

				(i.metaKey || i.ctrlKey);
				var b = this.getBoundingClientRect();
				var n = i.clientX - b.left,
					o = i.clientY - b.top;

				Editor.UI.DomUtils.startDrag("default", i, function( i, s, r, c, d ) {
					var a = c * c + d * d;
					if ( !(4 > a) ) {
						var h = n,
							l = o;
						0 > c && (h += c, c = -c);
						0 > d && (l += d, d = -d);
						this.$.gizmosView.updateSelectRect( h, l, c, d );
						this.$.graph.updateSelectRect( h, l, c, d );
						this.didDragSelectionRect = true;
					}
				}.bind( this ), function( i, s, r, c, d ) {
					var a = c * c + d * d;
					if ( !(4 > a) ) {
						this.$.gizmosView.fadeoutSelectRect();
					}
					this.selecting = false;
				}.bind( this ) );
			}
		},
		_onMouseLeave: function() {
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
		},
		_onCloseEditMode: function() {
		},
		zoomAll: function() {
			var left = Infinity;
			var top = Infinity;
			var right = -Infinity;
			var bottom = -Infinity;

			var nodes = this.$.graph.querySelectorAll("shader-node");

			// Find the bounding rect
			for(var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (node.offsetLeft < left) {
					left = node.offsetLeft;
				}
				if (node.offsetTop < top) {
					top = node.offsetTop;
				}
				if (node.offsetLeft + node.offsetWidth > right) {
					right = node.offsetLeft + node.offsetWidth;
				}
				if (node.offsetTop + node.offsetHeight > bottom) {
					bottom = node.offsetTop + node.offsetHeight;
				}
			}

			var width = right - left;
			var height = bottom - top;

			// Fit the scale to enclose the bounding rect
			var scaleW = this.$.graph.offsetWidth / width;
			var scaleH = this.$.graph.offsetHeight / height;

			var scale = Math.min(scaleW, scaleH);
			scale = Math.min(scale, 1);

			// Find the offset to place the view center on the center on the center of the bounding rect
			var dx = -left * scale;
			if (width * scale !== this.$.graph.offsetWidth) {
				dx += 0.5 * (this.$.graph.offsetWidth - scale * width);
			}

			var dy = -top * scale;
			if (height * scale !== this.$.graph.offsetHeight) {
				dy += 0.5 * (this.$.graph.offsetHeight - scale * height);
			}

			// Apply the transform
			this.$.grid.xAxisSync( dx, scale );
			this.$.grid.yAxisSync( dy, scale );
			this.$.grid.repaint();
			this.$.gizmosView.scale = scale;
			this.$.graph.setTransform(scale, scale, dx, dy);
		}
	});
})();
