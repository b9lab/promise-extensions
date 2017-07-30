/* jshint expr: true */
"use strict";

const chai = require('chai');
const expect = chai.expect;
const Promise = require("bluebird");
Promise.allSequential = require("../utils/allSequential.js");

describe("allSequential", function() {
    it("should resolve all promises", function() {
        return Promise.allSequential([
            () => Promise.resolve("a"),
            () => Promise.resolve("b")
        ])
            .then(results => {
                expect(results.length).to.equal(2);
                expect(results[ 0 ]).to.equal("a");
                expect(results[ 1 ]).to.equal("b");
            })
    });

    it("should not initiate before the previous has finished", function() {
        const trace = [];
        return Promise.allSequential([
            () => new Promise(resolve => {
                trace.push("a");
                resolve("b");
            })
                .then(x => trace.push(x)),
            () => new Promise(resolve => {
                trace.push("c");
                resolve("d");
            })
                .then(x => trace.push(x))
        ])
            .then(results => {
                expect(trace).to.deep.equal([ "a", "b", "c", "d" ]);
            });
    });

    it("should keep execution order in case of delay", function() {
        this.slow(400);
        const trace = [];
        return Promise.allSequential([
            () => Promise.resolve("a").delay(300).then(x => trace.push(x)),
            () => Promise.resolve("b").then(x => trace.push(x))
        ])
            .then(results => {
                expect(trace).to.deep.equal([ "a", "b" ]);
            });
    });
});