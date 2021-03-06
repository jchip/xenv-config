"use strict";

const xenvConfig = require("../..");
const { merge } = require("lodash");

describe("xenv-config", function() {
  describe("from env", function() {
    it("should load config", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "hello";
      const cfg = xenvConfig({ test: { env: k } });
      delete process.env[k];
      expect(cfg).to.deep.equal({ test: "hello" });
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should translate using envMap", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "hello";
      const cfg = xenvConfig({ test: { env: k, envMap: { hello: "xyz" } } });
      delete process.env[k];
      expect(cfg).to.deep.equal({ test: "xyz" });
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should call post", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "hello";
      const cfg = xenvConfig({ test: { env: k, post: (v, t) => `${v}-${t.src}` } });
      delete process.env[k];
      expect(cfg).to.deep.equal({ test: "hello-env" });
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should use key as env var name if spec.env is true", () => {
      const k = `TEST${Date.now()}`;
      process.env[k] = "hello";
      const cfg = xenvConfig({ [k]: { env: true } });
      delete process.env[k];
      expect(cfg[k]).to.equal("hello");
      expect(cfg.__$trace__[k]).to.deep.equal({ src: "env", name: k });
    });

    it("should load config thru array of env", () => {
      const now = Date.now();
      const envs = [`A${now}`, `B${now}`, `C${now}`];
      process.env[envs[1]] = "hello";
      const cfg = xenvConfig({ test: { env: envs } });
      delete process.env[envs[1]];
      expect(cfg.test).to.equal("hello");
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: envs[1] });
    });

    it("should load config from default if array of env not found", () => {
      const now = Date.now();
      const envs = [`A${now}`, `B${now}`, `C${now}`];
      const cfg = xenvConfig({ test: { env: envs, default: "foobar" } });
      expect(cfg.test).to.equal("foobar");
      expect(cfg.__$trace__.test).to.deep.equal({ src: "default" });
    });

    it("should load config if array of env all not found", () => {
      const now = Date.now();
      const envs = [`X${now}`, `Y${now}`, `Z${now}`];
      const cfg = xenvConfig({ test: { env: envs } }, { test: "world" });
      expect(cfg.test).to.equal("world");
      expect(cfg.__$trace__.test).to.deep.equal({ src: "option" });
    });

    it("should load config by type from default", () => {
      const k = `K${Date.now()}`;
      ["true", "True", "yes", "Yes", "1", "On", "on"].forEach(x => {
        process.env[k] = x;
        const cfg = xenvConfig({ test: { env: k, default: false } });
        expect(cfg.test).to.equal(true);
        delete process.env[k];
        expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
      });
    });

    it("should load config from default callback", () => {
      const val = Date.now();
      const cfg = xenvConfig({ test: { type: "number", default: () => val } });
      expect(cfg.test).to.equal(val);
      expect(cfg.__$trace__.test).to.deep.equal({ src: "default" });
    });

    it("should load as string config from default callback", () => {
      const val = `${Date.now()}`;
      const cfg = xenvConfig({ test: { default: () => val } });
      expect(cfg.test).to.equal(val);
      expect(cfg.__$trace__.test).to.deep.equal({ src: "default" });
    });

    it("should not call default callback if env exist", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "true";
      const cfg = xenvConfig({
        test: {
          env: k,
          type: "boolean",
          default: () => {
            throw new Error("default shouldn't be called");
          }
        }
      });
      expect(cfg.test).to.equal(true);
      delete process.env[k];
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should load env value, by type from default, as boolean", () => {
      const k = `K${Date.now()}`;
      ["true", "True", "yes", "Yes", "1", "On", "on"].forEach(x => {
        process.env[k] = x;
        const cfg = xenvConfig({ test: { env: k, default: false } });
        expect(cfg.test).to.equal(true);
        delete process.env[k];
        expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
      });
    });

    it("should load default config with type as boolean", () => {
      [true, false].forEach(x => {
        const cfg = xenvConfig({ test: { type: "boolean", default: x } });
        expect(cfg.test).to.equal(x);
        expect(cfg.__$trace__.test).to.deep.equal({ src: "default" });
      });
    });

    it("should load env value, by type from default, as number", () => {
      const k = `K${Date.now()}`;
      process.env[k] = 999;
      const cfg = xenvConfig({ test: { env: k, default: 0 } });
      expect(cfg.test).to.equal(999);
      delete process.env[k];
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should load env value by type as string", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "555";
      const cfg = xenvConfig({ test: { env: k, type: "string" } });
      expect(cfg.test).to.equal("555");
      delete process.env[k];
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should load env value by type as number", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "555";
      const cfg = xenvConfig({ test: { env: k, type: "number" } });
      expect(cfg.test).to.equal(555);
      delete process.env[k];
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should load env value by type as float", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "1.5";
      const cfg = xenvConfig({ test: { env: k, type: "float" } });
      expect(cfg.test).to.equal(1.5);
      delete process.env[k];
    });

    it("should load true env value by type as boolean", () => {
      const k = `K${Date.now()}`;
      ["true", "True", "yes", "Yes", "1", "On", "on"].forEach(x => {
        process.env[k] = x;
        const cfg = xenvConfig({ test: { env: k, type: "boolean" } });
        expect(cfg.test).to.equal(true);
        delete process.env[k];
        expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
      });
    });

    it("should load false env value by type as boolean", () => {
      const k = `K${Date.now()}`;
      ["false", "no", "0", "off"].forEach(x => {
        process.env[k] = x;
        const cfg = xenvConfig({ test: { env: k, type: "boolean" } });
        expect(cfg.test).to.equal(false);
        delete process.env[k];
        expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
      });
    });

    it("should throw if load non-string env value as type boolean", () => {
      const env = { foo: null };
      expect(() => xenvConfig({ test: { env: "foo", type: "boolean" } }, {}, { _env: env })).to
        .throw;
    });

    it("should load false env value by type as truthy", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "";
      const cfg = xenvConfig({ test: { env: k, type: "truthy" } });
      expect(cfg.test).to.equal(false);
      delete process.env[k];
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should load true env value by type as truthy", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "false";
      const cfg = xenvConfig({ test: { env: k, type: "truthy" } });
      expect(cfg.test).to.equal(true);
      delete process.env[k];
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });

    it("should load env value as string if type is unknown", () => {
      const k = `K${Date.now()}`;
      process.env[k] = "false";
      const cfg = xenvConfig({ test: { env: k, type: "blah" } });
      expect(cfg.test).to.equal("false");
      delete process.env[k];
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env", name: k });
    });
  });

  describe("from user options", function() {
    it("should load config if env is not defined", () => {
      const cfg = xenvConfig({ test: { type: "number" } }, { test: 999 });
      expect(cfg.test).to.equal(999);
      expect(cfg.__$trace__.test).to.deep.equal({ src: "option" });
    });

    it("should load config if env doesn't exist", () => {
      const cfg = xenvConfig({ test: { env: `K${Date.now()}`, type: "number" } }, { test: 222 });
      expect(cfg.test).to.equal(222);
      expect(cfg.__$trace__.test).to.deep.equal({ src: "option" });
    });

    it("should load config if sources set it first", () => {
      const k = `TEST${Date.now()}`;
      process.env[k] = 999;
      const cfg = xenvConfig(
        { test: { env: k, type: "number" } },
        { test: 222 },
        { sources: ["option", "env"] }
      );
      expect(cfg.test).to.equal(222);
      expect(cfg.__$trace__.test).to.deep.equal({ src: "option" });
    });
  });

  describe("from default", function() {
    it("should load config if it's supplied", () => {
      const cfg = xenvConfig({ test: { env: `K${Date.now()}`, default: 555, type: "number" } }, {});
      expect(cfg.test).to.equal(555);
      expect(cfg.__$trace__.test).to.deep.equal({ src: "default" });
    });

    it("should not load config if it's not supplied", () => {
      const cfg = xenvConfig({ test: { env: `K${Date.now()}`, type: "number" } });
      expect(cfg).to.not.have.property("test");
      expect(cfg.__$trace__).to.not.have.property("test");
    });
  });

  describe("for json type", function() {
    it("should parse json from env", () => {
      const envKey = "TEST_JSON";
      const x = { foo: "123", a: { b: 5 } };
      const cfg = xenvConfig(
        { test: { env: envKey, type: "json" } },
        {},
        { _env: { [envKey]: JSON.stringify(x) }, merge }
      );
      expect(JSON.stringify(cfg.test)).to.equal(JSON.stringify(x));
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env" });
    });

    it("should return nothing if no sources available", () => {
      const envKey = "TEST_JSON";
      const cfg = xenvConfig({ test: { env: envKey, type: "json" } }, {}, { _env: {} });
      expect(cfg).to.deep.equal({});
      expect(cfg.__$trace__.test).to.deep.equal(undefined);
    });

    it("should parse json from env by type from default", () => {
      const envKey = "TEST_JSON";
      const x = { foo: "123", a: { b: 5 } };
      const cfg = xenvConfig(
        { test: { env: envKey, default: {} } },
        {},
        { _env: { [envKey]: JSON.stringify(x) }, merge }
      );
      expect(JSON.stringify(cfg.test)).to.equal(JSON.stringify(x));
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env,default" });
    });

    it("should parse and merge json from all by type from default", () => {
      const envKey = "TEST_JSON";
      const x = { foo: "123", a: { b: 5 } };
      const cfg = xenvConfig(
        { test: { env: envKey, default: { d: 1 } } },
        { test: { o: true, foo: "456", a: { c: 9 } } },
        { _env: { [envKey]: JSON.stringify(x) }, merge }
      );
      expect(cfg.test).to.deep.equal({ d: 1, o: true, foo: "123", a: { c: 9, b: 5 } });
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env,option,default" });
    });

    it("should use Object.assign if no merge provided", () => {
      const envKey = "TEST_JSON";
      const x = { foo: "123", a: { b: 5 } };
      const cfg = xenvConfig(
        { test: { env: envKey, default: { d: 1 } } },
        { test: { o: true, foo: "456", a: { c: 9 } } },
        { _env: { [envKey]: JSON.stringify(x) } }
      );
      expect(cfg.test).to.deep.equal({ d: 1, o: true, foo: "123", a: { b: 5 } });
      expect(cfg.__$trace__.test).to.deep.equal({ src: "env,option,default" });
    });
  });
});
