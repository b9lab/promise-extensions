/* jshint expr: true */
"use strict";

const chai = require('chai');
const expect = chai.expect;
const sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

describe("getTransactionReceiptMined", function() {
    let web3;

    beforeEach("mock Web3", function() {
        web3 = { eth: { getTransactionReceipt: sinon.stub() } };
        web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
    });

    describe("with a hash", function() {
        it("should pass receipt on directly if not null", function() {
            this.timeout(1000);
            web3.eth.getTransactionReceipt.throws();
            web3.eth.getTransactionReceipt.withArgs("hash1").yieldsAsync(undefined, "receipt1");
            return web3.eth.getTransactionReceiptMined("hash1", 5000)
                .then(receipt => {
                    expect(receipt).to.equal("receipt1");
                    expect(web3.eth.getTransactionReceipt).to.have.been.calledOnce;
                    expect(web3.eth.getTransactionReceipt).to.have.been.calledWith("hash1");
                });
        });

        it("should ask again receipt if null the first time", function() {
            web3.eth.getTransactionReceipt.throws();
            web3.eth.getTransactionReceipt.withArgs("hash1")
                .onCall(0).yieldsAsync(undefined, null)
                .onCall(1).yieldsAsync(undefined, "receipt1");
            return web3.eth.getTransactionReceiptMined("hash1", 1)
                .then(receipt => {
                    expect(receipt).to.equal("receipt1");
                    expect(web3.eth.getTransactionReceipt).to.have.been.calledTwice;
                    expect(web3.eth.getTransactionReceipt.getCall(0)).to.have.been.calledWith("hash1");
                    expect(web3.eth.getTransactionReceipt.getCall(1)).to.have.been.calledWith("hash1");
                });
        });

        it("should ask again for receipt many times if null the first time", function() {
            web3.eth.getTransactionReceipt.throws();
            let seqDef = web3.eth.getTransactionReceipt.withArgs("hash1");
            for (let i = 0; i < 10; i++) {
                seqDef = seqDef.onCall(i).yieldsAsync(undefined, i == 9 ? "receipt1" : null);
            }
            return web3.eth.getTransactionReceiptMined("hash1", 1)
                .then(receipt => {
                    expect(receipt).to.equal("receipt1");
                    expect(web3.eth.getTransactionReceipt.callCount).to.equal(10);
                    for (let i = 0; i < 10; i++) {
                        expect(web3.eth.getTransactionReceipt.getCall(i)).to.have.been.calledWith("hash1");
                    }
                });
        });
    });

    describe("with an array of hashes", function() {
        beforeEach("should spy on", function() {
            web3.eth.getTransactionReceiptMined = sinon.spy(web3.eth.getTransactionReceiptMined);
        });

        it("should pass hashes to itself", function() {
            this.timeout(1000);
            web3.eth.getTransactionReceipt.throws();
            web3.eth.getTransactionReceipt.withArgs("hash1").yieldsAsync(undefined, "receipt1");
            web3.eth.getTransactionReceipt.withArgs("hash2").yieldsAsync(undefined, "receipt2");
            return web3.eth.getTransactionReceiptMined([ "hash1", "hash2" ], 5000)
                .then(() => {
                    expect(web3.eth.getTransactionReceiptMined.callCount).to.equal(3);
                    expect(web3.eth.getTransactionReceiptMined.getCall(1)).to.have.been.calledWith("hash1", 5000);
                    expect(web3.eth.getTransactionReceiptMined.getCall(2)).to.have.been.calledWith("hash2", 5000);
                });
        });

        it("should return array of results", function() {
            this.timeout(1000);
            web3.eth.getTransactionReceipt.throws();
            web3.eth.getTransactionReceipt.withArgs("hash1").yieldsAsync(undefined, "receipt1");
            web3.eth.getTransactionReceipt.withArgs("hash2").yieldsAsync(undefined, "receipt2");
            return web3.eth.getTransactionReceiptMined([ "hash1", "hash2" ], 5000)
                .then(receipts => {
                    expect(receipts).to.deep.equal([ "receipt1", "receipt2" ]);
                });
        });
    });

    describe("measure time", function() {
        let clock;

        beforeEach("should fake time", function() {
            clock = sinon.useFakeTimers("setTimeout");
        });

        afterEach("should restore time", function() {
            clock.restore();
        });

        it("should enforce the interval", function() {
            web3.eth.getTransactionReceipt.withArgs("hash1")
                // We need to hit setTimeout as part of the call, so no Async
                .onCall(0).yields(undefined, null)
                .onCall(1).yields(undefined, "receipt1");
            const promise = web3.eth.getTransactionReceiptMined("hash1", 1000);
            expect(web3.eth.getTransactionReceipt).to.have.been.calledOnce;
            clock.tick(500);
            expect(web3.eth.getTransactionReceipt).to.have.been.calledOnce;
            clock.tick(500);
            expect(web3.eth.getTransactionReceipt).to.have.been.calledTwice;
        });

        it("should use default interval of 500", function() {
            web3.eth.getTransactionReceipt.withArgs("hash1")
                // We need to hit setTimeout as part of the call, so no Async
                .onCall(0).yields(undefined, null)
                .onCall(1).yields(undefined, "receipt1");
            const promise = web3.eth.getTransactionReceiptMined("hash1");
            expect(web3.eth.getTransactionReceipt).to.have.been.calledOnce;
            clock.tick(499);
            expect(web3.eth.getTransactionReceipt).to.have.been.calledOnce;
            clock.tick(1);
            expect(web3.eth.getTransactionReceipt).to.have.been.calledTwice;
        });
    });

    describe("invalid type", function() {
        it("should reject boolean", function() {
            try {
                web3.eth.getTransactionReceiptMined(true);
                expect(true).to.be.false;
            } catch (error) {
                expect(error.message).to.contain("Invalid Type");
            }
        });
    });
});