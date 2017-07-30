/* jshint expr: true */
"use strict";

const chai = require('chai');
const expect = chai.expect;
const Promise = require("bluebird");
Promise.allSequentialNamed = require("../utils/allSequentialNamed.js");

describe("allSequential", function() {
    it("should resolve all promises with mapped names", function() {
        return Promise.allSequentialNamed({
            a: () => Promise.resolve("a"),
            b: () => Promise.resolve("b")
        })
            .then(results => {
                expect(results).to.deep.equal({ a: "a", b: "b" });
            });
    });

    it("should not initiate before the previous has finished", function() {
        const trace = [];
        return Promise.allSequentialNamed({
            a: () => new Promise(resolve => {
                trace.push("a");
                resolve("b");
            })
                .then(x => trace.push(x)),
            b: () => new Promise(resolve => {
                trace.push("c");
                resolve("d");
            })
                .then(x => trace.push(x))
        })
            .then(results => {
                expect(trace).to.deep.equal([ "a", "b", "c", "d" ]);
            });
    });

    it("should keep execution order in case of delay", function() {
        this.slow(400);
        const trace = [];
        return Promise.allSequentialNamed({
            a: () => Promise.resolve("a").delay(300).then(x => trace.push(x)),
            b: () => Promise.resolve("b").then(x => trace.push(x))
        })
            .then(results => {
                expect(trace).to.deep.equal([ "a", "b" ]);
            });
    });
});