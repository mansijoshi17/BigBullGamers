import React, { useEffect, useState } from "react";
import { withRouter } from "next/router";
import { Web3Context } from "../context/Web3Context";
import { Avatar, Fab } from "@material-ui/core";
import { ToastContainer, toast } from "react-toastify";
import { collection, where, getDocs, query } from "firebase/firestore";
import { db } from "../firebase/clientApp";
import web3 from "web3";

function NftDetails({ router: { query } }) {
  const web3Context = React.useContext(Web3Context);
  const latestTime = Math.floor(Date.now() / 1000);
  const {
    buyNft,
    loader,
    getCreatorData,
    creator,
    getNftDataByTokenId,
    nftDetails,
    rentNft,
    rentLoading,
    withdrawNft,
    withdrawLoading,
    uploadforAdvertisement,
  } = web3Context;
  const [selected, setSelected] = useState(query?.onemonthPrice);

  useEffect(() => {
    if (query.seller !== undefined) {
      getCreatorData(query.seller);
    }
    setSelected(query?.onemonthPrice);
    getNftDataByTokenId(query.tokenId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <>
      <div className="no-bottom no-top" id="content">
        <div id="top" />
        {}
        <ToastContainer />
        <section id="subheader" className="text-light">
          <div className="center-y relative text-center"></div>
        </section>
        {}
        <section aria-label="section" className=" sm-mt-0">
          <div className="container">
            <div className="row">
              <div className="col-md-6 text-center">
                <img
                  alt="nft-img"
                  src={query.image}
                  className="img-fluid img-rounded mb-sm-30"
                />
              </div>
              <div className="col-md-6">
                <div className="item_info">
                  <h2>{`${query.name}#${query.tokenId}`}</h2>

                  <p>{query.description} </p>
                  <div className="d-flex flex-row mb-4">
                    <div className="mr40">
                      <h6>Creator Address</h6>
                      <div className="item_author">
                        <div className="author_list_pp">{query.seller}</div>
                      </div>
                    </div>
                  </div>
                  <div className="currentPrice">Current Price</div>
                  <div className="form-group">
                    <select
                      className="form-control"
                      id="exampleFormControlSelect1"
                      value={selected}
                      onChange={(e) => {
                        setSelected(e.target.value);
                      }}
                    >
                      <option selected value={query.onemonthPrice}>
                        1 Month
                      </option>
                      <option value={query.threemonthPrice}>3 Month</option>
                      <option value={query.sixmonthPrice}>6 Month</option>
                      <option value={query.twelvemonthPrice}>12 Month</option>
                    </select>
                  </div>
                  <div className="de_tab tab_simple">
                    <div className="details-btn">
                      <div>
                        <div className="price">
                          <img
                            src={"/img/usdc.png"}
                            height={"40px"}
                            width={"50px"}
                            alt="true"
                          />
                          <div style={{ marginLeft: "10px" }}>
                            {selected} USDC
                          </div>
                        </div>
                      </div>

                      {query.onRent == "true" ? (
                        <div className="rentBlock">
                          <div className="currentPrice">
                            Rent Price (Renting Period:{" "}
                            {query.rentingDuration + " " + "days"})
                          </div>

                          <div className="price">
                            <img
                              src={
                                query.token == "MATIC"
                                  ? "/img/polygon-matic-logo.png"
                                  : query.token == "ETH"
                                  ? "/img/eth.png"
                                  : "/img/bnb.png"
                              }
                              height={"30px"}
                              width={"30px"}
                              alt="true"
                            />
                            <div style={{ marginLeft: "10px" }}>
                              {query.rentingAmount == undefined
                                ? ""
                                : web3.utils.fromWei(
                                    query.rentingAmount.toString(),
                                    "ether"
                                  )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="spacer-10 mt-3"></div>
                    <div className="details-btn">
                      {query.page === "explore" &&
                      query.purchased == "false" &&
                      query.onRent === "false" ? (
                        <div
                          className="btn-main btn-lg"
                          onClick={() => buyNft(query, parseInt(selected))}
                        >
                          {loader == true
                            ? "Loading...! Please wait it will take time"
                            : "Buy Now"}
                        </div>
                      ) : query.page !== "explore" ? (
                        ""
                      ) : (
                        <div className="btn-main btn-lg" aria-disabled={true}>
                          Sold Out
                        </div>
                      )}
                      {query.page === "explore" &&
                      query.onRent === "true" &&
                      query.rented === "false" &&
                      query.purchased == "false" ? (
                        <div
                          className="btn-main btn-lg rent"
                          onClick={() => rentNft(nftDetails)}
                        >
                          {rentLoading == true
                            ? "Loading...! Please wait it will take time"
                            : "Rent Now"}
                        </div>
                      ) : query.page == "explore" && query.rented == true ? (
                        <div className="btn-main btn-lg" aria-disabled={true}>
                          Rented
                        </div>
                      ) : (
                        ""
                      )}
                      {query.page === "myitems" &&
                      query.rented === "true" &&
                      query.expiryTime &&
                      latestTime > query.expiryTime ? (
                        <div
                          className="btn-main btn-lg rent"
                          onClick={() => withdrawNft(nftDetails)}
                        >
                          {withdrawLoading == true
                            ? "Loading...! Please wait it will take time"
                            : "Withdraw NFT"}
                        </div>
                      ) : (
                        ""
                      )}
                      {query.page === "myitems" &&
                        query.purchased === "true" &&
                        query.uploaded === "false" && (
                          <div
                            className="btn-main btn-lg rent"
                            onClick={() => uploadforAdvertisement(nft)}
                          >
                            Upload For Advertisment
                          </div>
                        )}
                    </div>
                    &nbsp;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* <div className="modal fade" id="buy_now" tabindex="-1" aria-labelledby="buy_now" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered de-modal">
                    <div className="modal-content">
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        <div className="modal-body">
                            <div className="p-3 form-border">
                                <h3>Checkout</h3>
                                You are about to purchase a <b>AnimeSailorClub #304</b> from <b>Monica Lucas</b>
                                <div className="spacer-single"></div>
                                <h6>Enter quantity. <span className="id-color-2">10 available</span></h6>
                                <input type="text" name="buy_now_qty" id="buy_now_qty" className="form-control" value="1" />
                                <div className="spacer-single"></div>
                                <div className="de-flex">
                                    <div>Your balance</div>
                                    <div><b>10.67856 ETH</b></div>
                                </div>
                                <div className="de-flex">
                                    <div>Service fee 2.5%</div>
                                    <div><b>0.00325 ETH</b></div>
                                </div>
                                <div className="de-flex">
                                    <div>You will pay</div>
                                    <div><b>0.013325 ETH</b></div>
                                </div>
                                <div className="spacer-single"></div>
                                <a href="wallet.html" target="_blank" className="btn-main btn-fullwidth">Add funds</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>  */}

      <a href="#" id="back-to-top"></a>
    </>
  );
}
export default withRouter(NftDetails);
