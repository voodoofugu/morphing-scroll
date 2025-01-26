"use strict";
var e = require("react");
const t = ({
    children: t,
    root: r,
    threshold: n,
    rootMargin: s,
    style: o,
    visibleContent: l = !1,
    onVisible: i,
    intersectionDelay: c,
  }) => {
    const [a, u] = e.useState(!1),
      g = e.useRef(null),
      d = e.useRef(null),
      h = s
        ? "number" == typeof s
          ? `${s}px ${s}px ${s}px ${s}px`
          : 2 === s.length
          ? `${s[0]}px ${s[1]}px ${s[0]}px ${s[1]}px`
          : `${s[0]}px ${s[1]}px ${s[2]}px ${s[3]}px`
        : "",
      m = (e) => {
        e.forEach((e) => {
          u(e.isIntersecting);
        });
      },
      p = { root: r, threshold: n, rootMargin: h };
    return (
      e.useEffect(() => {
        const e = new IntersectionObserver(m, p);
        return (
          g.current && e.observe(g.current),
          () => {
            g.current && e.unobserve(g.current);
          }
        );
      }, [r, n, s]),
      e.useEffect(
        () => (
          c
            ? (d.current = setTimeout(() => {
                a && i && i();
              }, c))
            : a && i && i(),
          () => {
            d.current && clearTimeout(d.current);
          }
        ),
        [a]
      ),
      e.createElement("div", { ref: g, style: o }, (l || a) && t)
    );
  },
  r = ({ measure: t = "inner", style: r, onResize: n, children: s }) => {
    const o = e.useRef(null),
      [l, i] = e.useState({ width: 0, height: 0 });
    e.useEffect(() => {
      const e = o.current;
      if ((null == e || e.parentElement, !e)) return;
      const t = new ResizeObserver((e) => {
        for (const t of e) {
          const e = t.contentRect.width,
            r = t.contentRect.height;
          i({ width: e, height: r }), n && n(e, r);
        }
      });
      return (
        t.observe(e),
        () => {
          t.unobserve(e), t.disconnect();
        }
      );
    }, [t, n]);
    const c = { minWidth: "100%", minHeight: "100%" },
      a = { width: "max-content", height: "max-content" },
      u = {
        inner: Object.assign({}, a),
        outer: Object.assign({}, c),
        all: Object.assign(Object.assign({}, c), a),
      };
    return e.createElement(
      "div",
      {
        className: "resizeTracker",
        ref: o,
        style: Object.assign(Object.assign({}, u[t]), r),
      },
      s(l.width, l.height)
    );
  },
  n = e.memo(
    ({
      children: r,
      elementTop: n,
      left: s,
      mRootLocal: o,
      scrollElementRef: l,
      xyObject: i,
      xyObjectReverse: c,
      objectsSizeLocal: a,
      rootMargin: u,
      suspending: g,
      fallback: d,
      infiniteScroll: h,
      lazyRender: m,
      attribute: p,
      objectsPerDirection: f,
      direction: b,
    }) => {
      const y = g ? e.createElement(e.Suspense, { fallback: d }, r) : r,
        v = Object.assign(
          { width: c ? `${c}px` : "", height: i ? `${i}px` : "" },
          "x" === b && { display: "flex" }
        ),
        x = Object.assign(
          { width: a[0] ? `${a[0]}px` : "" },
          "x" === b && { transform: "rotate(-90deg) scaleX(-1)" }
        ),
        j = {
          root: l.current,
          rootMargin: h ? u : o,
          style: h
            ? Object.assign(
                Object.assign(
                  Object.assign(Object.assign({}, v), {
                    position: "absolute",
                    top: `${n}px`,
                  }),
                  s && { left: `${s}px` }
                ),
                !c && 1 === f && { transform: "translateX(-50%)" }
              )
            : v,
        },
        w = e.createElement(
          "div",
          Object.assign({}, p ? { "wrap-id": p } : {}, { style: x }),
          y
        );
      return h
        ? e.createElement(
            "div",
            {
              style: Object.assign(
                Object.assign(
                  Object.assign(
                    { position: "absolute", top: `${n}px` },
                    s && { left: `${s}px` }
                  ),
                  !c && 1 === f && { transform: "translateX(-50%)" }
                ),
                v
              ),
            },
            w
          )
        : m
        ? e.createElement(t, Object.assign({}, j), w)
        : e.createElement("div", { style: v }, w);
    }
  );
(n.displayName = "ScrollObject"),
  (exports.IntersectionTracker = t),
  (exports.MorphScroll = ({
    scrollID: t = "",
    type: s = "scroll",
    className: o = "",
    size: l,
    objectsSize: i,
    direction: c = "y",
    gap: a,
    padding: u = [0, 0, 0, 0],
    progressReverse: g = !1,
    progressTrigger: d = { wheel: !0 },
    progressVisibility: h = "visible",
    lazyRender: m = !1,
    rootMargin: p = 0,
    suspending: f = !1,
    fallback: b = null,
    scrollTop: y,
    infiniteScroll: v = !1,
    edgeGradient: x,
    objectsWrapFullMinSize: j,
    children: w,
    onScrollValue: O,
    elementsAlign: E = !1,
    contentAlign: $,
    isScrolling: M,
    stopLoadOnScroll: R,
  }) => {
    var T;
    const z = e.useReducer(() => ({}), {})[1],
      k = e.useRef(null),
      S = e.useRef(null),
      C = e.useRef(null),
      N = e.useRef(null),
      A = e.useRef(null),
      B = e.useRef(null),
      Y = e.useRef("none"),
      L = e.useRef(0),
      D = e.useRef([]),
      q = e.useRef(null),
      I = e.useRef(0),
      V = e.useRef(null),
      [F, W] = e.useState(!1),
      [X, H] = e.useState({ width: 0, height: 0 }),
      [P, G] = e.useState({ width: 0, height: 0 }),
      [J, K] = e.useState({ width: 0, height: 0 }),
      Q = `${e.useId()}`.replace(/^(.{2})(.*).$/, "$2"),
      U = Object.assign({ value: 1, duration: 200 }, y),
      Z = {
        position: "absolute",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
      },
      _ = { color: "rgba(0,0,0,0.4)", size: 40 },
      ee = e.useMemo(() => e.Children.toArray(w).filter((e) => null != e), [w]),
      te = e.useMemo(() => {
        if ("end" === U.value && ee.length > 0) {
          const t = ee[0];
          if (e.isValidElement(t)) return t.key;
        }
      }, [ee]),
      re = Object.assign(
        Object.assign({}, { size: 40 }),
        "object" == typeof d.arrows ? d.arrows : {}
      ),
      ne = "object" == typeof x ? Object.assign(Object.assign({}, _), x) : _,
      se = {
        position: "absolute",
        left: 0,
        width: "100%",
        pointerEvents: "none",
        transition: "opacity 0.1s ease-in-out",
        background: `linear-gradient(${ne.color}, transparent)`,
        height: `${ne.size}px`,
      },
      oe =
        "number" == typeof u
          ? [u, u, u, u]
          : 2 === u.length
          ? [u[0], u[1], u[0], u[1]]
          : 3 === u.length
          ? [u[0], u[1], u[2], u[1]]
          : u,
      [le, ie, ce, ae] = "x" === c ? [oe[1], oe[2], oe[3], oe[0]] : oe,
      ue = oe[1] + oe[3],
      ge = le + ce,
      de = ae + ie,
      [he, me] = e.useMemo(() => {
        var e, t;
        return "number" == typeof a
          ? [a, a]
          : "x" === c
          ? [
              null !== (e = null == a ? void 0 : a[1]) && void 0 !== e ? e : 0,
              null !== (t = null == a ? void 0 : a[0]) && void 0 !== t ? t : 0,
            ]
          : [0, 0];
      }, [a, c]),
      pe = e.useMemo(
        () => [
          "number" == typeof i[0]
            ? i[0]
            : "none" === i[0]
            ? null
            : "firstChild" === i[0]
            ? J.width
            : null,
          "number" == typeof i[1]
            ? i[1]
            : "none" === i[1]
            ? null
            : "firstChild" === i[1]
            ? J.height
            : null,
        ],
        [i, ue, J]
      ),
      fe = "x" === c ? pe[0] : pe[1],
      be = "x" === c ? pe[1] : pe[0],
      ye = p
        ? "number" == typeof p
          ? [p, p, p, p]
          : "x" === c
          ? 2 === p.length
            ? [p[0], p[1], p[0], p[1]]
            : [p[1], p[0], p[3], p[2]]
          : 2 === p.length
          ? [p[1], p[0], p[1], p[0]]
          : p
        : null,
      [ve, xe] =
        ye && p ? ("x" === c ? [ye[3], ye[1]] : [ye[2], ye[0]]) : [0, 0],
      je = e.useMemo(() => {
        const [e, t] = l && Array.isArray(l) ? l : [X.width, X.height];
        return d.arrows && re.size
          ? "x" === c
            ? [e ? e - 2 * re.size : e, t, e, t]
            : [e, t ? t - 2 * re.size : t, e, t]
          : [e, t, e, t];
      }, [l, c, re.size, X]),
      we = "x" === c ? je[0] : je[1],
      Oe = "x" === c ? je[1] : je[0],
      Ee = e.useMemo(() => {
        const e = be ? be + he : null;
        return e ? Math.floor((Oe - ue) / e) : 1;
      }, [be, Oe, he, ue]),
      $e = e.useMemo(() => {
        if (!v || Ee <= 1) return [];
        const e = ee.map((e, t) => t);
        if (!e) return [];
        const t = Array.from({ length: Ee }, () => []);
        return (
          e.forEach((e) => {
            t[e % Ee].push(e);
          }),
          t
        );
      }, [w, Ee, v]),
      Me = e.useMemo(
        () => (Ee > 1 ? Math.ceil(ee.length / Ee) : ee.length),
        [ee.length, Ee]
      ),
      Re = e.useMemo(() => {
        const e = Ee || 1;
        return be
          ? be * e + (e - 1) * me
          : v
          ? (J.width + me) * e - me
          : P.width;
      }, [be, Ee, me, P, J]),
      Te = e.useMemo(
        () =>
          fe
            ? fe * Me + (Me - 1) * he
            : v
            ? (J.height + he) * Me - he
            : P.height,
        [fe, Me, he, P, J]
      ),
      ze = e.useMemo(() => Te + ge, [Te, ge]),
      ke = e.useMemo(() => Re + de, [Re, de]),
      Se =
        (null === (T = C.current) || void 0 === T ? void 0 : T.scrollTop) || 0,
      Ce = Math.round(Se + we) !== ze,
      Ne = e.useMemo(
        () =>
          ("hidden" === h && ze) || 0 === Te
            ? 0
            : we
            ? Math.round((we / ze) * we)
            : 0,
        [we, ze, h]
      ),
      Ae = e.useMemo(() => (we ? ze - we : ze), [ze, we]),
      Be = e.useMemo(
        () =>
          "number" == typeof U.value
            ? U.value
            : "end" === U.value && ze > we
            ? Ae
            : 1,
        [y, ze, Ae]
      ),
      Ye = e.useMemo(() => (je[0] && je[1] ? je[0] / 2 - je[1] / 2 : 0), [je]),
      Le = e.useMemo(() => {
        let e = [],
          t = 0;
        if (v && E) {
          const r = Array.from({ length: ee.length }, (e, t) => t),
            n = Math.abs(Math.floor(ee.length / Ee) * Ee - ee.length);
          (e = n ? r.slice(-n) : []),
            "center" === E
              ? (t = (((null != be ? be : 0) + me) * (Ee - n)) / 2)
              : "end" === E && (t = ((null != be ? be : 0) + me) * (Ee - n));
        }
        return ee.map((r, n) => {
          const s = (function (e, t) {
              if (!t) return [0, e];
              for (let r = 0; r < t.length; r++) {
                const n = t[r].indexOf(e);
                if (-1 !== n) return [r, n];
              }
              return [0, 0];
            })(n, $e),
            o = (function (e) {
              return 0 !== e ? ((null != fe ? fe : 0) + he) * e + le : le;
            })(v ? (Ee > 1 ? s[1] : n) : 0),
            l = v && pe[1] ? o + pe[1] : 0,
            i =
              v && be
                ? be * s[0] +
                  me * s[0] +
                  ("x" === c ? oe[0] : oe[1]) +
                  (E && e.length > 0 && e.includes(n) ? t : 0)
                : 0;
          return { elementTop: o, elementBottom: l, left: i };
        });
      }, [w, $e, pe, a, v, Ee]),
      De = e.useMemo(() => {
        var e, t;
        if (!$) return {};
        const [r, n = "start"] = $,
          s =
            "start" === r
              ? "flex-start"
              : "center" === r
              ? "center"
              : "flex-end",
          o =
            "start" === n
              ? "flex-start"
              : "center" === n
              ? "center"
              : "flex-end",
          l = null !== (e = je[0]) && void 0 !== e ? e : 0,
          i = null !== (t = je[1]) && void 0 !== t ? t : 0,
          a = "x" === c ? l > ze : i > ze,
          u = {};
        return (
          ("x" === c ? i > ke : l > ke) &&
            (u.justifyContent = "x" === c ? o : s),
          a && (u.alignItems = "x" === c ? s : o),
          u
        );
      }, [$, c, je, ze, ke]),
      qe = e.useCallback(
        (e) => (e ? Math.ceil : Math.floor)(ze / we),
        [we, ze]
      ),
      Ie = (e) => {
        e && (e.style.cursor = "grabbing");
      },
      Ve = (e) => {
        e && "grabbing" === e.style.cursor && (e.style.cursor = "grab");
      },
      Fe = (e, t) => {
        if (e) {
          const r = e.querySelector(`.${t}`);
          r && (r.style.opacity = "0");
        }
      },
      We = e.useCallback(
        (e) => {
          const t = C.current,
            r = N.current;
          if (!t || !r) return;
          const n = r.clientHeight,
            s = qe(),
            o = (e) => _e(e);
          "first" === e &&
            t.scrollTop > 0 &&
            o(t.scrollTop <= we ? 0 : t.scrollTop - we),
            "last" === e &&
              s &&
              t.scrollTop + we !== n &&
              o(t.scrollTop + we >= we * s ? n : t.scrollTop + we);
        },
        [C, N, qe]
      ),
      Xe = e.useCallback(() => {
        const e = C.current;
        if (e && S.current && B.current) {
          function t() {
            var t;
            const r =
              null === (t = B.current) || void 0 === t
                ? void 0
                : t.querySelectorAll(".sliderElem");
            r &&
              r.forEach((t, r) => {
                var n, s;
                const o =
                  (null !== (n = null == e ? void 0 : e.scrollTop) &&
                  void 0 !== n
                    ? n
                    : 0) >=
                    we * r &&
                  (null !== (s = null == e ? void 0 : e.scrollTop) &&
                  void 0 !== s
                    ? s
                    : 0) <
                    we * (r + 1);
                t.classList.toggle("active", o);
              });
          }
          t();
        }
      }, [we, ze]),
      He = e.useCallback(() => {
        z();
        const e = C.current;
        if (e) {
          if (
            (R && W(!0),
            null == M || M(!0),
            V.current && clearTimeout(V.current),
            (V.current = setTimeout(() => {
              R && W(!1), null == M || M(!1);
            }, 200)),
            0 !== Ne && "hidden" !== h)
          ) {
            const t = Math.abs(Math.round((e.scrollTop / Ae) * (we - Ne)));
            t !== I.current &&
              "slider" !== s &&
              (I.current = Ne + t > we ? we - Ne : t),
              0 === e.scrollTop && "none" === Y.current && (e.scrollTop = 1),
              O &&
                O.forEach((t) => {
                  t(e.scrollTop);
                });
          }
          x && Xe();
        }
      }, [we, Ne, I, h, O, Xe, M]),
      Pe = e.useCallback(
        (e) => {
          const t = C.current,
            r = qe();
          if (t && r) {
            if (["thumb", "wrapp"].includes(Y.current)) {
              const n = "thumb" === Y.current ? 1 : -1;
              t.scrollTop += ("x" === c ? e.movementX : e.movementY) * r * n;
            }
            if ("slider" === Y.current) {
              const r = N.current;
              if (!r) return;
              const n = r.clientHeight,
                s = (e) =>
                  _e(e, () => {
                    (L.current = 0), z();
                  }),
                o = (e) => {
                  const r = t.scrollTop + e * we;
                  s(e > 0 ? Math.min(r, n - we) : Math.max(r, 0));
                };
              e.movementY > 0 && L.current < 1
                ? ((L.current += e.movementY),
                  L.current >= 1 && t.scrollTop + we != n && o(1))
                : e.movementY < 0 &&
                  L.current > -1 &&
                  ((L.current -= Math.abs(e.movementY)),
                  L.current <= -1 && 0 != t.scrollTop && o(-1));
            }
          }
        },
        [c, C, qe]
      ),
      Ge = e.useCallback(
        (e) => {
          if (
            (window.removeEventListener("mousemove", Pe),
            window.removeEventListener("mouseup", Ge),
            document.body.style.removeProperty("cursor"),
            Ve(N.current),
            Ve(A.current),
            (Y.current = "none"),
            "hover" === h)
          ) {
            let t = e.target,
              r = !1;
            for (; t && t !== document.body; ) {
              if (t === S.current) {
                r = !0;
                break;
              }
              t = t.parentNode;
            }
            r || Fe(S.current, "scroll" === s ? "scrollBar" : "sliderBar");
          }
          z();
        },
        [Pe, k, h, s]
      ),
      Je = e.useCallback(
        (e) => {
          (Y.current = e),
            z(),
            window.addEventListener("mousemove", Pe),
            window.addEventListener("mouseup", Ge),
            (document.body.style.cursor = "grabbing");
        },
        [Pe, Ge, k]
      ),
      Ke = e.useCallback(
        (e, t) => {
          const r = { width: e, height: t - ge };
          (X.width === r.width && X.height === r.height) || H(r);
        },
        [ge, X]
      ),
      Qe = e.useCallback(
        (e, t) => {
          const r = { width: e - de, height: t - ge };
          (P.width === r.width && P.height === r.height) || G(r);
        },
        [de, ge, P]
      ),
      Ue = e.useCallback(
        (e, t) => {
          const r = { width: e, height: t };
          (J.width === r.width && J.height === r.height) || K(r);
        },
        [J]
      );
    let Ze;
    const _e = e.useCallback(
      (e, t) => {
        const r = C.current;
        if (!r) return null;
        const n = r.scrollTop,
          s = performance.now(),
          o = (l) => {
            const i = l - s,
              c = Math.min(i / U.duration, 1);
            null != e && (r.scrollTop = n + (e - n) * c),
              i < U.duration ? requestAnimationFrame(o) : null == t || t();
          };
        return (Ze = requestAnimationFrame(o)), () => cancelAnimationFrame(Ze);
      },
      [C]
    );
    e.useEffect(() => {
      function e(e, r, n = !1) {
        console.warn(
          `You are using the ${e} ${n ? "with" : "without"} ${r}${
            t ? ` in ${t}` : ""
          } 👺`
        );
      }
      !m && p && g && e("rootMargin", "lazyRender"),
        v && m && g && e("lazyRender", "infiniteScroll", !0),
        "hidden" === h &&
          (g && e("progressReverse", "progressVisibility `hidden`", !0),
          d.progressElement &&
            e(
              "progressTrigger [`scrollThumb`]",
              "progressVisibility `hidden`",
              !0
            ),
          d.arrows &&
            e("progressTrigger [`arrows`]", "progressVisibility `hidden`", !0)),
        !f && b && g && e("fallback", "suspending"),
        v && z(),
        Xe();
    }, []),
      e.useEffect(() => {
        if (C.current && ee.length > 0) {
          let e;
          return (
            "end" === U.value
              ? (q.current || (q.current = te),
                (e = q.current === te ? _e(Be) : null),
                (q.current = te))
              : (e = _e(Be)),
            () => {
              e && e(), (D.current = []), V.current && clearTimeout(V.current);
            }
          );
        }
      }, [Be, Te]),
      e.useEffect(() => {
        if (R) {
          const e = document.querySelectorAll(`[wrap-id^="${Q}-"]`),
            t = Array.from(e, (e) => e.getAttribute("wrap-id"));
          D.current = t;
        }
      }, [F]);
    const et = e.createElement(
        "div",
        {
          className: "objectsWrapper",
          ref: N,
          onMouseDown: () => {
            d.content && (Je("wrapp"), Ie(N.current));
          },
          style: Object.assign(
            Object.assign(
              Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign(
                      Object.assign(
                        Object.assign(
                          {
                            padding: `${le}px ${ie}px ${ce}px ${ae}px`,
                            height: v && ze ? `${ze}px` : "fit-content",
                            width: Re ? `${Re}px` : "",
                          },
                          d.content && { cursor: "grab" }
                        ),
                        v && { position: "relative" }
                      ),
                      !v && { display: "flex" }
                    ),
                    !v && Ee > 1 && { flexWrap: "wrap" }
                  ),
                  !v && Ee <= 1 && { flexDirection: "column" }
                ),
                a && !v && { gap: `${he}px ${me}px` }
              ),
              E &&
                !v && {
                  justifyContent:
                    "start" === E
                      ? "flex-start"
                      : "center" === E
                      ? "center"
                      : "flex-end",
                }
            ),
            j && { minHeight: we - ge + "px" }
          ),
        },
        ee.map((t, s) => {
          var o, l;
          const a = t.key,
            u = {
              scrollElementRef: C,
              xyObjectReverse: be,
              xyObject: fe,
              rootMargin: p,
              suspending: f,
              fallback: b,
              mRootLocal: ye,
              objectsSizeLocal: pe,
            },
            g = R && !D.current.includes(`${Q}-${a}`) && F ? b : t,
            d =
              ("number" == typeof i[0] && "number" == typeof i[1]) ||
              ("firstChild" !== i[0] && "firstChild" !== i[1]) ||
              0 !== s
                ? g
                : e.createElement(r, { onResize: Ue }, () => g);
          if (!v)
            return e.createElement(
              n,
              Object.assign({ key: a }, u, {
                lazyRender: m,
                objectsPerDirection: Ee,
                objectsSize: i,
                direction: c,
                attribute: R ? `${Q}-${a}` : "",
              }),
              d
            );
          {
            const { elementTop: t, elementBottom: r, left: g } = Le[s];
            if (
              ("x" === c
                ? null !== (o = je[0]) && void 0 !== o
                  ? o
                  : 0
                : null !== (l = je[1]) && void 0 !== l
                ? l
                : 0) +
                ve >
                t - Se &&
              r - Se > 0 - xe
            )
              return e.createElement(
                n,
                Object.assign({ key: a }, u, {
                  elementTop: t,
                  left: g,
                  infiniteScroll: v,
                  attribute: R ? `${Q}-${a}` : "",
                  objectsPerDirection: Ee,
                  objectsSize: i,
                  direction: c,
                }),
                d
              );
          }
        })
      ),
      tt = e.createElement(
        "div",
        {
          "m-s": "〈♦〉",
          className: "customScroll" + (o ? ` ${o}` : ""),
          ref: k,
          style: { width: `${je[2]}px`, height: `${je[3]}px` },
        },
        e.createElement(
          "div",
          {
            className: "scrollContent",
            ref: S,
            onMouseEnter: () =>
              "hover" === h &&
              ((e, t) => {
                if (e) {
                  const r = e.querySelector(`.${t}`);
                  r && (r.style.opacity = "1");
                }
              })(S.current, "scroll" === s ? "scrollBar" : "sliderBar"),
            onMouseLeave: () =>
              "hover" === h &&
              "thumb" !== Y.current &&
              "slider" !== Y.current &&
              Fe(S.current, "scroll" === s ? "scrollBar" : "sliderBar"),
            style: Object.assign(
              Object.assign(
                { position: "relative", width: `${Oe}px`, height: `${we}px` },
                "x" === c && {
                  transform: `rotate(-90deg) translate(${Ye}px, ${Ye}px) scaleX(-1)`,
                }
              ),
              d.arrows &&
                re.size &&
                ("x" === c ? { left: `${re.size}px` } : { top: `${re.size}px` })
            ),
          },
          e.createElement(
            "div",
            {
              className: "scrollElement",
              ref: C,
              onScroll: He,
              style: Object.assign(
                Object.assign(
                  Object.assign(
                    { display: "flex", width: "100%", height: "100%" },
                    De
                  ),
                  d.wheel
                    ? { overflow: "hidden scroll" }
                    : { overflow: "hidden hidden" }
                ),
                "boolean" != typeof d.progressElement ||
                  !1 === d.progressElement
                  ? { scrollbarWidth: "none" }
                  : {}
              ),
            },
            "string" != typeof i[0] || "string" != typeof i[1] || v
              ? et
              : e.createElement(r, { onResize: Qe }, () => et)
          ),
          x &&
            e.createElement("div", {
              className: "edge",
              style: Object.assign(Object.assign({}, se), {
                top: 0,
                opacity: Se > 1 ? 1 : 0,
              }),
            }),
          x &&
            e.createElement("div", {
              className: "edge",
              style: Object.assign(Object.assign({}, se), {
                bottom: 0,
                opacity: Ce ? 1 : 0,
                transform: "scaleY(-1)",
              }),
            }),
          d.arrows &&
            e.createElement(
              e.Fragment,
              null,
              e.createElement(
                "div",
                {
                  className: "arrowBox" + (Se > 1 ? " active" : ""),
                  style: Object.assign(Object.assign({}, Z), {
                    top: 0,
                    transform: "translateY(-100%)",
                    height: `${re.size}px`,
                  }),
                  onClick: () => We("first"),
                },
                re.element
              ),
              e.createElement(
                "div",
                {
                  className: "arrowBox" + (Ce ? " active" : ""),
                  style: Object.assign(Object.assign({}, Z), {
                    bottom: 0,
                    transform: "translateY(100%) scaleY(-1)",
                    height: `${re.size}px`,
                  }),
                  onClick: () => We("last"),
                },
                re.element
              )
            ),
          "hidden" !== h &&
            Ne < we &&
            "boolean" != typeof d.progressElement &&
            e.createElement(
              e.Fragment,
              null,
              "slider" !== s
                ? e.createElement(
                    "div",
                    {
                      className: "scrollBar",
                      style: Object.assign(
                        Object.assign(
                          Object.assign(
                            Object.assign(
                              { position: "absolute", top: 0 },
                              g ? { left: 0 } : { right: 0 }
                            ),
                            { width: "fit-content", height: "100%" }
                          ),
                          !1 != !d.progressElement && { pointerEvents: "none" }
                        ),
                        "hover" === h && {
                          opacity: 0,
                          transition: "opacity 0.1s ease-in-out",
                        }
                      ),
                    },
                    e.createElement(
                      "div",
                      {
                        ref: A,
                        className: "scrollBarThumb",
                        onMouseDown: () => {
                          d.progressElement && (Je("thumb"), Ie(A.current));
                        },
                        style: Object.assign(
                          {
                            height: `${Ne}px`,
                            willChange: "transform",
                            transform: `translateY(${I.current}px)`,
                          },
                          d.progressElement && { cursor: "grab" }
                        ),
                      },
                      d.progressElement
                    )
                  )
                : e.createElement(
                    "div",
                    {
                      className: "sliderBar",
                      style: Object.assign(
                        Object.assign(
                          Object.assign(
                            {
                              position: "absolute",
                              top: "50%",
                              transform: "translateY(-50%)",
                            },
                            g ? { left: 0 } : { right: 0 }
                          ),
                          !d.progressElement && { pointerEvents: "none" }
                        ),
                        "hover" === h && {
                          opacity: 0,
                          transition: "opacity 0.1s ease-in-out",
                        }
                      ),
                      ref: B,
                      onMouseDown: () => Je("slider"),
                    },
                    Array.from({ length: qe() || 0 }, (t, r) =>
                      e.createElement(
                        "div",
                        {
                          key: r,
                          className: "sliderElem",
                          style: { width: "fit-content" },
                        },
                        d.progressElement
                      )
                    )
                  )
            )
        )
      );
    return l
      ? tt
      : e.createElement(r, { measure: "outer", onResize: Ke }, () => tt);
  }),
  (exports.ResizeTracker = r);
