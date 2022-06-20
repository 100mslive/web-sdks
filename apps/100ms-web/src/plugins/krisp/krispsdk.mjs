/*!
 *
 *    @license KRISP TECHNOLOGIES, INC
 *
 *   KRISP TECHNOLOGIES, INC
 *   __________________
 *
 *   [2018] - [2022] Krisp Technologies, Inc
 *   All Rights Reserved.
 *
 *   NOTICE: By accessing this programming code, you acknowledge that you have read, understood, and agreed to the User Agreement available at
 *   https://krisp.ai/terms-of-use.
 *
 *   Please note that ALL information contained herein is and remains the property of Krisp Technologies, Inc., and its affiliates or assigns, if any. The intellectual property
 *   contained herein is proprietary to Krisp Technologies, Inc. and may be covered by pending and granted U.S. and Foreign Patents, and is further protected by
 *   copyright, trademark and/or other forms of intellectual property protection.
 *   Dissemination of this information or reproduction of this material IS STRICTLY FORBIDDEN.
 *
 */
const a0_0x369e44 = a0_0x584f;
function a0_0x584f(_0xa2f678, _0x3fd8be) {
  const _0x1b8e06 = a0_0x1b8e();
  return (
    (a0_0x584f = function (_0x584ffe, _0x429bdb) {
      _0x584ffe = _0x584ffe - 0x1b2;
      let _0x2865b5 = _0x1b8e06[_0x584ffe];
      return _0x2865b5;
    }),
    a0_0x584f(_0xa2f678, _0x3fd8be)
  );
}
(function (_0x545539, _0x5a7071) {
  const _0x587886 = a0_0x584f,
    _0x416bde = _0x545539();
  while ([]) {
    try {
      const _0x58b6e8 =
        (-parseInt(_0x587886(0x1b6)) / 0x1) *
          (-parseInt(_0x587886(0x1e2)) / 0x2) +
        parseInt(_0x587886(0x1bf)) / 0x3 +
        (parseInt(_0x587886(0x1ba)) / 0x4) *
          (parseInt(_0x587886(0x1bd)) / 0x5) +
        parseInt(_0x587886(0x1ce)) / 0x6 +
        -parseInt(_0x587886(0x1cf)) / 0x7 +
        (-parseInt(_0x587886(0x1b2)) / 0x8) *
          (-parseInt(_0x587886(0x1c2)) / 0x9) +
        -parseInt(_0x587886(0x1ed)) / 0xa;
      if (_0x58b6e8 === _0x5a7071) break;
      else _0x416bde["push"](_0x416bde["shift"]());
    } catch (_0x37a239) {
      _0x416bde["push"](_0x416bde["shift"]());
    }
  }
})(a0_0x1b8e, 0xec934);
var e = {
    d: (_0x39f5e5, _0x37adb2) => {
      const _0x38f9ea = a0_0x584f;
      for (var _0x165249 in _0x37adb2)
        e["o"](_0x37adb2, _0x165249) &&
          !e["o"](_0x39f5e5, _0x165249) &&
          Object[_0x38f9ea(0x1e4)](_0x39f5e5, _0x165249, {
            enumerable: !0x0,
            get: _0x37adb2[_0x165249],
          });
    },
    o: (_0x31ee3a, _0x2c9ffe) =>
      Object["prototype"][a0_0x369e44(0x1d2)][a0_0x369e44(0x1b7)](
        _0x31ee3a,
        _0x2c9ffe
      ),
  },
  o = {};
e["d"](o, { Z: () => r });
const t =
    void 0x0 !== window[a0_0x369e44(0x1e5)]
      ? window["AudioContext"]
      : void 0x0 !== window[a0_0x369e44(0x1c9)]
      ? window["webkitAudioContext"]
      : null,
  d = Object["freeze"]({
    not_init: a0_0x369e44(0x1d7),
    no_support: a0_0x369e44(0x1d3),
    invalid_audio_context: a0_0x369e44(0x1cd),
    invalid_weight_file: a0_0x369e44(0x1cc),
    weight_file_load_error: a0_0x369e44(0x1de),
    processor_load_error:
      "Krisp\x20processor\x20could\x20not\x20be\x20loaded\x20please\x20check\x20the\x20path\x20and\x20the\x20file\x20to\x20be\x20valid",
  }),
  a = Object[a0_0x369e44(0x1c4)]({
    model_8: a0_0x369e44(0x1cb),
    model_16: a0_0x369e44(0x1ea),
    model_32: a0_0x369e44(0x1dd),
    model_nc_auto: a0_0x369e44(0x1bb),
    model_vad: a0_0x369e44(0x1c8),
  });
class l extends AudioWorkletNode {
  [a0_0x369e44(0x1d1)]() {
    const _0x2cd0e5 = a0_0x369e44;
    this[_0x2cd0e5(0x1ee)]["postMessage"]({ type: _0x2cd0e5(0x1c0) });
  }
  [a0_0x369e44(0x1d9)]() {
    const _0x42895b = a0_0x369e44;
    (this[_0x42895b(0x1e1)] = !0x0),
      this[_0x42895b(0x1ee)][_0x42895b(0x1d8)]({
        type: "enable_disable",
        enabled: !0x0,
      });
  }
  [a0_0x369e44(0x1b5)]() {
    const _0x36ced3 = a0_0x369e44;
    (this["enabled"] = !0x1),
      this["port"][_0x36ced3(0x1d8)]({ type: "enable_disable", enabled: !0x1 });
  }
  ["isEnabled"]() {
    const _0x22caf7 = a0_0x369e44;
    return this[_0x22caf7(0x1e1)];
  }
  [a0_0x369e44(0x1eb)](_0x4e42e1) {
    const _0x332e55 = a0_0x369e44;
    this[_0x332e55(0x1ee)][_0x332e55(0x1d8)]({
      type: "logging",
      enabled: _0x4e42e1,
    });
  }
}
class i extends l {
  [a0_0x369e44(0x1c5)](_0x3ba513) {
    const _0x4a3541 = a0_0x369e44;
    _0x3ba513 instanceof Function &&
      (this[_0x4a3541(0x1ee)][_0x4a3541(0x1b9)] = ({ data: _0xd08529 }) => {
        const _0x4cd0fc = _0x4a3541;
        _0x3ba513(_0xd08529[_0x4cd0fc(0x1e3)]);
      });
  }
}
const r = Object[a0_0x369e44(0x1c4)]({
  ModelOptions: a,
  async create(_0x5ac934, _0x4949f5) {
    const _0x507bfa = a0_0x369e44;
    if (!t) throw new Error(d[_0x507bfa(0x1b3)]);
    if (!(_0x5ac934 instanceof t)) throw new Error(d[_0x507bfa(0x1c1)]);
    const _0x2a9803 = _0x4949f5[_0x507bfa(0x1e8)] || "";
    _0x4949f5["modelOption"] ||
      (_0x4949f5[_0x507bfa(0x1ec)] = a[_0x507bfa(0x1da)]),
      _0x4949f5["modelOption"] === a[_0x507bfa(0x1da)] &&
        (_0x4949f5["modelOption"] =
          _0x5ac934[_0x507bfa(0x1d6)] <= 0x1f40
            ? a[_0x507bfa(0x1b4)]
            : _0x5ac934["sampleRate"] <= 0x3e80
            ? a["model_16"]
            : a["model_32"]);
    const _0x362da6 = _0x2a9803 + "/" + _0x4949f5[_0x507bfa(0x1e6)],
      _0x40baaa = _0x507bfa(0x1b8);
    let _0x24c424,
      _0xf3e242 = Object[_0x507bfa(0x1c4)]({
        [a[_0x507bfa(0x1b4)]]: _0x4949f5[_0x507bfa(0x1b4)],
        [a[_0x507bfa(0x1df)]]: _0x4949f5[_0x507bfa(0x1df)],
        [a[_0x507bfa(0x1d4)]]: _0x4949f5[_0x507bfa(0x1d4)],
        [a[_0x507bfa(0x1dc)]]: _0x4949f5[_0x507bfa(0x1dc)],
      })[_0x4949f5[_0x507bfa(0x1ec)]];
    if (!_0xf3e242)
      throw new Error(
        d["invalid_weight_file"] +
          ":" +
          (_0x507bfa(0x1e0) + _0x4949f5[_0x507bfa(0x1ec)] + _0x507bfa(0x1c7))
      );
    _0xf3e242 = _0x2a9803 + "/" + _0xf3e242;
    try {
      _0x24c424 = await ((_0x3e296d = _0xf3e242),
      new Promise((_0x13d694, _0x59d75c) => {
        const _0x151076 = _0x507bfa,
          _0x367af5 = new XMLHttpRequest();
        (_0x367af5[_0x151076(0x1be)] = _0x185a05 => {
          const _0x538fb7 = _0x151076;
          _0x185a05
            ? _0x13d694(_0x185a05[_0x538fb7(0x1c3)][_0x538fb7(0x1e9)])
            : _0x59d75c();
        }),
          (_0x367af5["responseType"] = _0x151076(0x1c6)),
          _0x367af5[_0x151076(0x1bc)](_0x151076(0x1e7), _0x3e296d, !0x0),
          _0x367af5[_0x151076(0x1d5)]();
      }));
    } catch (_0x13999d) {
      throw new Error(d[_0x507bfa(0x1d0)]);
    }
    var _0x3e296d;
    try {
      await _0x5ac934[_0x507bfa(0x1ca)]["addModule"](_0x362da6);
    } catch (_0x13515f) {
      throw new Error(d[_0x507bfa(0x1db)]);
    }
    const _0x58dd07 = _0x4949f5[_0x507bfa(0x1ec)] === a[_0x507bfa(0x1dc)],
      _0x4f1c83 = _0x58dd07
        ? new i(_0x5ac934, _0x40baaa)
        : new l(_0x5ac934, _0x40baaa);
    return (
      _0x4f1c83["port"]["postMessage"]({
        isVad: _0x58dd07,
        type: "init",
        data: _0x24c424,
        sampleRate: _0x5ac934[_0x507bfa(0x1d6)],
      }),
      _0x4f1c83
    );
  },
});
var n = o["Z"];
function a0_0x1b8e() {
  const _0x5bf65c = [
    "webkitAudioContext",
    "audioWorklet",
    "narrow-band",
    "Invalid\x20weight\x20file\x20url",
    "Invalid\x20audio\x20context",
    "11050020RPEago",
    "12379423gILpsQ",
    "weight_file_load_error",
    "kill",
    "hasOwnProperty",
    "Platform\x20not\x20supported",
    "model_32",
    "send",
    "sampleRate",
    "Not\x20initialized,\x20first\x20run\x20Krisp.init()",
    "postMessage",
    "enable",
    "model_nc_auto",
    "processor_load_error",
    "model_vad",
    "full-band",
    "Weight\x20file\x20could\x20not\x20be\x20loaded,\x20please\x20check\x20the\x20path\x20and\x20file\x20to\x20be\x20valid",
    "model_16",
    "\x20Please\x20provide\x20a\x20valid\x20weight\x20file\x20url\x20for\x20",
    "enabled",
    "2966FICwTA",
    "vadResult",
    "defineProperty",
    "AudioContext",
    "processor",
    "GET",
    "rootDir",
    "response",
    "wide-band",
    "setLogging",
    "modelOption",
    "39282010SmQdlF",
    "port",
    "8XcrSyb",
    "no_support",
    "model_8",
    "disable",
    "785jhvLpX",
    "call",
    "krisp-processor",
    "onmessage",
    "44412blYyMI",
    "NC\x20Auto",
    "open",
    "715akSeFq",
    "onload",
    "5641833liOdek",
    "destroy",
    "invalid_audio_context",
    "1723833vifsDj",
    "target",
    "freeze",
    "setCallback",
    "arraybuffer",
    "\x20model",
    "vad",
  ];
  a0_0x1b8e = function () {
    return _0x5bf65c;
  };
  return a0_0x1b8e();
}
export { n as default };
