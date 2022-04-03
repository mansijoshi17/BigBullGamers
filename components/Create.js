import React, { useState, useEffect } from "react";

import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Web3Context } from "../context/Web3Context";

import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";
import {
  nftaddress,
  nftmarketaddress,
  rentFactoryAddress,
  ropstenAddress,
  ropstenMarketAddress,
  bscAddress,
  bscMarketAddress,
  chainLinkPriceFeed,
} from "../config";
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
import RentFactory from "../artifacts/contracts/RentFactory.sol/RentFactory.json";
import Rent from "../artifacts/contracts/Rent.sol/Rent.json";
import chainlinkABI from "../abi/ChainlinkPriceFeed.json";
import web3 from "web3";
import { ToastContainer, toast } from "react-toastify";
import { Avatar, Fab } from "@material-ui/core";
import { db, auth, storage } from "../firebase/clientApp";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
  where,
  query,
} from "firebase/firestore";
import { Form } from "react-bootstrap";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import * as moment from "moment/moment";
import { NFTStorage, File } from "nft.storage";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");
const NFTclient = new NFTStorage({
  token: process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY,
});
function Create() {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
    category: "",
    nftType: "",
    chain: "Polygon",
    token: "MATIC",
    onRent: "false",
    rentContractAdd: "",
    rentingPrice: "",
    earningPercentage: "",
    startTime: "",
    expiryTime: "",
    rented: false,
    renter: "",
    purchased: false,
    buyer: "",
    rentingDuration: "",
    subCategory: "",
    onemonthPrice: "",
    threemonthPrice: "",
    sixmonthPrice: "",
    twelvemonthPrice: "",
    uploaded: "false",
  });
  const router = useRouter();
  const [loader, setLoader] = useState(false);
  const [selectedCategory, setCategory] = useState("");
  const [usdValue, setUsdValue] = useState();
  const [priceFeedCon, setPriceFeedCon] = useState();

  const web3Context = React.useContext(Web3Context);
  const { currentAddress, userData, userId } = web3Context;

  const {
    name,
    description,
    price,
    category,
    nftType,
    chain,
    token,
    onRent,
    rentingPrice,
    earningPercentage,
    startTime,
    expiryTime,
    rented,
    renter,
    purchased,
    buyer,
    rentingDuration,
    subCategory,
    onemonthPrice,
    threemonthPrice,
    sixmonthPrice,
    twelvemonthPrice,
    uploaded,
  } = formInput;

  const categoryOption = [
    {
      category: "Gaming Area",
      subCategory: ["G1", "G2", "G3", "G4"],
    },
    {
      category: "Contest",
      subCategory: ["C1", "C2", "C3", "C4"],
    },
    {
      category: "Airdrop",
      subCategory: ["A1", "A2", "A3", "A4"],
    },
  ];

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const priceFeed = new ethers.Contract(
      chainLinkPriceFeed,
      chainlinkABI,
      signer
    );
    setPriceFeedCon(priceFeed);
  }, []);

  useEffect(() => {
    if (priceFeedCon !== undefined) {
      getPrice();
    }
  }, [priceFeedCon]);

  async function getPrice() {
    let [price, decimals] = await priceFeedCon.getLatestPriceForMatic();
    price = Number(price / Math.pow(10, decimals)).toFixed(2);
    setUsdValue(price);
  }

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      // const metadata = await NFTclient.store({
      //   name: file.name,
      //   description: "NFT!",
      //   image: new File([file], file.name, { type: "image/jpg" }),
      // });
      // console.log(metadata.url, "NFTStorage");
      const metadataimg = {
        contentType: "image/jpeg",
      };
      const imageRef = ref(storage, "/images/" + file.name);
      uploadBytesResumable(imageRef, file, metadataimg)
        .then((snapshot) => {
          // Let's get a download URL for the file.
          getDownloadURL(snapshot.ref).then((url) => {
            console.log("url=====>", url);
            setFileUrl(url);
            // ...
          });
        })
        .catch((error) => {
          console.error("Upload failed", error);
          // ...
        });
    } catch (error) {
      toast.error("Error uploading file!!");
      console.log("Error uploading file: ", error);
    }
  }

  async function createItem() {
    if (!name || !description || !fileUrl) {
      alert("Please upload file and fillup all the form details");
      return;
    }

    // const pr = web3.utils.toWei(price, "ether");

    /* first, upload to IPFS */
    var rPrice;
    if (onRent == "true") {
      if (!rentingPrice || !earningPercentage || !startTime || !expiryTime) {
        alert("Please fillup all the renting form details");
        return;
      }
      rPrice = web3.utils.toWei(rentingPrice, "ether");
    }

    const data = JSON.stringify({
      name,
      price,
      seller: currentAddress,
      description,
      image: fileUrl,
      category,
      nftType,
      chain,
      token,
      onRent,
      startTime: onRent == "true" ? startTime.getTime() / 1000 : "",
      expiryTime: onRent == "true" ? expiryTime.getTime() / 1000 : "",
      rentingAmount:
        onRent == "true"
          ? parseInt(rPrice) +
            (parseInt(rPrice) * parseInt(earningPercentage)) / 100
          : "",
      renter,
      rentingDuration,
      selectedCategory,
      subCategory,
      onemonthPrice,
      threemonthPrice,
      sixmonthPrice,
      twelvemonthPrice,
      uploaded,
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      console.log(url, "Metadata");
      createSale(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
      toast.error("Error uploading file!!");
    }
  }

  function validateChain() {
    const networkId = window.ethereum.networkVersion;
    if (formInput.chain == "Binance" && networkId !== "97") {
      alert(
        "Please connect to the BSC Testnet network in Metamask to continue!"
      );
    } else if (formInput.chain == "Polygon" && networkId !== "80001") {
      alert(
        "Please connect to the Polygon Mumbai Testnet network in Metamask to continue!"
      );
    }
  }

  async function createSale(url) {
    const networkId = window.ethereum.networkVersion;
    if (formInput.chain == "Binance" && networkId !== "97") {
      alert(
        "Please connect to the BSC Testnet network in Metamask to continue!"
      );
    } else if (formInput.chain == "Polygon" && networkId !== "80001") {
      alert(
        "Please connect to the Polygon Mumbai Testnet network in Metamask to continue!"
      );
    }
    setLoader(true);
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let chainAddress;
    let chainMarketAddress;

    if (formInput.chain == "Binance") {
      chainAddress = bscAddress;
      chainMarketAddress = bscMarketAddress;
    } else {
      chainAddress = nftaddress;
      chainMarketAddress = nftmarketaddress;
    }

    let tokencontract = new ethers.Contract(chainAddress, NFT.abi, signer);
    let transaction = await tokencontract.createToken(url);
    let tx = await transaction.wait();
    let event = tx.events[0];
    let value = event.args[2];
    let tokenId = value.toNumber();

    let contract = new ethers.Contract(chainMarketAddress, Market.abi, signer);
    transaction = await contract.createMarketItem(chainAddress, tokenId);
    var rentingAmount;
    var rentCont;
    if (onRent == "true") {
      const listingPriceofRent = web3.utils.toWei(rentingPrice, "ether");
      let rentFactoryContract = new ethers.Contract(
        rentFactoryAddress,
        RentFactory.abi,
        signer
      );
      rentingAmount =
        parseInt(listingPriceofRent) +
        (parseInt(listingPriceofRent) * parseInt(earningPercentage)) / 100;

      let rentTransaction = await rentFactoryContract.createContract(
        currentAddress,
        parseInt(rentingAmount),
        chainAddress,
        "Wrapped BigBull",
        "WBBN",
        tokenId,
        startTime.getTime() / 1000,
        expiryTime.getTime() / 1000
      );
      let rentTx = await rentTransaction.wait();
      let rentEvent = rentTx.events[0];
      rentCont = rentEvent.args[1];
      const contractRent = new ethers.Contract(rentCont, Rent.abi, signer);
      await tokencontract.approve(await contractRent.wrappedToken(), tokenId);
    }

    const docRef = await addDoc(collection(db, "BigBull"), {
      tokenId: tokenId,
      name: name,
      price: price,
      seller: currentAddress,
      description: description,
      image: fileUrl,
      category: category,
      nftType: nftType,
      chain: chain,
      token: token,
      onRent: onRent,
      rentContractAdd: onRent == "true" ? rentCont : "",
      startTime: onRent == "true" ? startTime.getTime() / 1000 : "",
      expiryTime: onRent == "true" ? expiryTime.getTime() / 1000 : "",
      rentingAmount: onRent == "true" ? rentingAmount : "",
      rented: onRent == "true" ? rented : false,
      renter: onRent == "true" ? renter : "",
      purchased: purchased,
      buyer: "",
      rentingDuration: rentingDuration,
      selectedCategory: selectedCategory,
      subCategory: subCategory,
      onemonthPrice: onRent == "false" ? onemonthPrice : "",
      threemonthPrice: onRent == "false" ? threemonthPrice : "",
      sixmonthPrice: onRent == "false" ? sixmonthPrice : "",
      twelvemonthPrice: onRent == "false" ? twelvemonthPrice : "",
      createdAt: Timestamp.fromDate(new Date()).toDate(),
      uploaded,
    });

    await transaction.wait();
    setLoader(false);
    router.push("/my-items");
  }

  // async function onChange(e) {
  //   const file = e.target.files[0];
  //   try {
  //     const added = await client.add(
  //       file,
  //       {
  //         progress: (prog) => console.log(`received: ${prog}`)
  //       }
  //     )
  //     const url = `https://ipfs.infura.io/ipfs/${added.path}`
  //     setFileUrl(url)
  //   } catch (error) {
  //     console.log('Error uploading file: ', error);
  //   }
  // }

  return (
    <div className="no-bottom no-top" id="content">
      <div id="top" />
      {}
      <section id="subheader" className="text-light bg-container">
        <div className="center-y relative text-center">
          <div className="container">
            <div className="row">
              <div className="col-md-12 text-center">
                <h1>Create</h1>
              </div>
              <div className="clearfix" />
            </div>
          </div>
        </div>
      </section>
      {}
      <ToastContainer />
      {}
      <section aria-label="section">
        <div className="container">
          <div className="row wow fadeIn">
            <div className="col-lg-7 offset-lg-1">
              <form
                id="form-create-item"
                className="form-border"
                method="post"
                action="email.php"
              >
                <div className="field-set">
                  <h5>Upload file</h5>
                  <div className="d-create-file">
                    <p id="file_name">PNG, JPG, GIF, WEBP or MP4. Max 200mb.</p>
                    <label
                      htmlFor="files"
                      id="get_file"
                      name="Asset"
                      className="btn-main"
                      style={{ color: "white" }}
                    >
                      Browse
                    </label>
                    <input
                      id="files"
                      onChange={onChange}
                      style={{ display: "none" }}
                      type="file"
                    />
                  </div>
                  <div className="spacer-single" />
                  <h5>Title</h5>
                  <input
                    type="text"
                    name="item_title"
                    id="item_title"
                    onChange={(e) =>
                      updateFormInput({ ...formInput, name: e.target.value })
                    }
                    className="form-control"
                    placeholder="e.g. 'Crypto Funk"
                  />
                  <div className="spacer-10" />
                  <h5>Description</h5>
                  <textarea
                    data-autoresize
                    name="item_desc"
                    id="item_desc"
                    onChange={(e) =>
                      updateFormInput({
                        ...formInput,
                        description: e.target.value,
                      })
                    }
                    className="form-control"
                    placeholder="e.g. 'This is very limited item'"
                    defaultValue={""}
                  />

                  <div className="spacer-10" />
                  {/* <h5>Gift Type</h5>
                      <div className="form-group">
                        <select
                          className="form-control"
                          id="exampleFormControlSelect1"
                          onChange={(e) =>
                            updateFormInput({
                              ...formInput,
                              nftType: e.target.value,
                            })
                          }
                        >
                          <option selected value="">
                            Gift Type
                          </option>
                          <option value="Poetry">Poetry</option>
                          <option value="Cryptocurrency">Cryptocurrency</option>
                          <option value="Music">Music</option>
                          <option value="Art">Art</option>
                          <option value="Gamming Assets">Gamming Assets</option>
                          <option value="Metaverse">Metaverse</option>
                          <option value="Membership Subscription">
                            Membership Subscription
                          </option>
                          <option value="Event Ticket">Event Ticket</option>
                          <option value="Virtualand">Virtualand</option>
                        </select>
                      </div> */}

                  {/* <h5>Chain</h5>
                      <div className="form-group">
                        <select
                          className="form-control"
                          id="exampleFormControlSelect1"
                          onChange={(e) => {
                            const networkId = window.ethereum.networkVersion;
                            if (e.target.value == "Binance" && networkId !== "97") {
                              alert(
                                "Please connect to the BSC Testnet network in Metamask to continue!"
                              );
                            } else if (
                              e.target.value == "Polygon" &&
                              networkId !== "80001"
                            ) {
                              alert(
                                "Please connect to the Polygon Mumbai Testnet network in Metamask to continue!"
                              );
                            }
                            updateFormInput({
                              ...formInput,
                              chain: e.target.value,
                            });
                          }}
                        >
                          <option value="Polygon">Polygon Network</option>
                          <option value="Binance">Binance Smart Chain</option>
                        </select>
                      </div> */}

                  {/* <div className="spacer-10" />
                      <h5>Token</h5>
                      <div className="form-group">
                        <select
                          className="form-control"
                          id="exampleFormControlSelect1"
                          onChange={(e) => {
                            updateFormInput({
                              ...formInput,
                              token: e.target.value,
                            });
                          }}
                        >
                          {formInput.chain == "Binance" ? (
                            <option value="BNB">BNB</option>
                          ) : (
                            <>
                              {" "}
                              <option value="MATIC">MATIC</option>{" "}
                              <option value="ETH">ETH</option>{" "}
                            </>
                          )}
                        </select>
                      </div> */}

                  {/* <h5>Price</h5>
                  <input
                    type="text"
                    name="item_price"
                    id="item_price"
                    onChange={(e) =>
                      updateFormInput({ ...formInput, price: e.target.value })
                    }
                    className="form-control"
                    placeholder={`enter price for one item (${formInput.token})`}
                  /> */}

                  <div className="spacer-10" />
                  <h5>Category</h5>
                  <div className="form-group">
                    <select
                      className="form-control"
                      id="exampleFormControlSelect1"
                      value={selectedCategory}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option selected value=""></option>
                      {categoryOption.map((cat) => {
                        return (
                          <option value={cat.category}>{cat.category}</option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="spacer-10" />
                  <h5>Sub Category</h5>
                  <div className="form-group">
                    <select
                      className="form-control"
                      id="exampleFormControlSelect1"
                      onChange={(e) =>
                        updateFormInput({
                          ...formInput,
                          subCategory: e.target.value,
                        })
                      }
                    >
                      <option selected value=""></option>
                      {categoryOption.map((cat) => {
                        if (cat.category == selectedCategory) {
                          return cat.subCategory.map((subc) => {
                            return <option value={subc}>{subc}</option>;
                          });
                        }
                      })}
                    </select>
                  </div>
                  <div className="spacer-10" />
                  {formInput.onRent == "false" ? (
                    <>
                      <h5>Price</h5>
                      <div className="details-btn">
                        <div style={{ marginRight: "10px" }}>
                          <input
                            type="text"
                            name="onemonthPrice"
                            id="onemonthPrice"
                            onChange={(e) =>
                              updateFormInput({
                                ...formInput,
                                onemonthPrice: e.target.value,
                              })
                            }
                            className="form-control"
                            placeholder={`One month (USDCx)`}
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            name="threemonthPrice"
                            id="threemonthPrice"
                            onChange={(e) =>
                              updateFormInput({
                                ...formInput,
                                threemonthPrice: e.target.value,
                              })
                            }
                            className="form-control"
                            placeholder={`Three month (USDCx)`}
                          />
                        </div>
                      </div>
                      <div className="details-btn">
                        <div style={{ marginRight: "10px" }}>
                          <input
                            type="text"
                            name="sixmonthPrice"
                            id="sixmonthPrice"
                            onChange={(e) =>
                              updateFormInput({
                                ...formInput,
                                sixmonthPrice: e.target.value,
                              })
                            }
                            className="form-control"
                            placeholder={`Six month (USDCx)`}
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            name="twelvemonthPrice"
                            id="twelvemonthPrice"
                            onChange={(e) =>
                              updateFormInput({
                                ...formInput,
                                twelvemonthPrice: e.target.value,
                              })
                            }
                            className="form-control"
                            placeholder={`Twelve month (USDCx)`}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    ""
                  )}
                  <div className="spacer-10" />
                  <h5>On Rent?</h5>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="radio1"
                      name="rent"
                      value="true"
                      checked={formInput.onRent == "true" ? true : false}
                      onChange={(e) =>
                        updateFormInput({
                          ...formInput,
                          onRent: e.target.value,
                        })
                      }
                    />
                    Yes
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="radio2"
                      name="rent"
                      value="false"
                      checked={formInput.onRent == "false" ? true : false}
                      onChange={(e) =>
                        updateFormInput({
                          ...formInput,
                          onRent: e.target.value,
                        })
                      }
                    />
                    No
                  </div>
                  <div className="spacer-10" />
                  {formInput.onRent == "true" ? (
                    <>
                      <h5>Renting Price</h5>
                      <input
                        type="text"
                        name="rentingPrice"
                        id="renting_price"
                        onChange={(e) =>
                          updateFormInput({
                            ...formInput,
                            rentingPrice: e.target.value,
                          })
                        }
                        className="form-control rentPrice"
                        placeholder={`enter renting price for one item (${formInput.token})`}
                      />
                      <small id="emailHelp" class="form-text text-muted">
                        1 MATIC = {usdValue} USD
                      </small>
                      <div className="spacer-10" />
                      <h5>Interest Rate</h5>
                      <input
                        type="text"
                        name="earningPercentage"
                        id="earning_percentage"
                        onChange={(e) =>
                          updateFormInput({
                            ...formInput,
                            earningPercentage: e.target.value,
                          })
                        }
                        className="form-control"
                        placeholder={`enter interest rate (${formInput.token})`}
                      />
                      <div className="spacer-10" />
                      <div className="details-btn">
                        <div>
                          <form>
                            <h5>Start Date</h5>
                            <input
                              type="datetime-local"
                              id="startTime"
                              name="startTime"
                              onChange={(e) => {
                                var date = new Date(e.target.value);
                                updateFormInput({
                                  ...formInput,
                                  startTime: date,
                                });
                              }}
                            />
                          </form>
                        </div>
                        <div className="spacer-10" />
                        <div>
                          <form>
                            <h5>End Date</h5>
                            <input
                              type="datetime-local"
                              id="expiryTime"
                              name="expiryTime"
                              onChange={(e) => {
                                var date = new Date(e.target.value);

                                var sdate = moment(new Date(startTime)).format(
                                  "DD.MM.YYYY"
                                );
                                var startDate = moment(
                                  sdate.toString(),
                                  "DD.MM.YYYY"
                                );
                                var edate = moment(date).format("DD.MM.YYYY");
                                var endDate = moment(
                                  edate.toString(),
                                  "DD.MM.YYYY"
                                );

                                var result = endDate.diff(startDate, "days");
                                updateFormInput({
                                  ...formInput,
                                  expiryTime: date,
                                  rentingDuration: result,
                                });
                              }}
                            />
                          </form>
                        </div>
                      </div>
                    </>
                  ) : (
                    ""
                  )}

                  <div className="spacer-10" />
                  <div className="spacer-10" />
                  <input
                    type="button"
                    id="submit"
                    className="btn-main"
                    defaultValue={
                      loader == true
                        ? "Loading...! Please wait it will take time"
                        : "Create Item"
                    }
                    onClick={createItem}
                    // disabled={loader ? true : false}
                  />
                </div>
              </form>
            </div>
            <div className="col-lg-3 col-sm-6 col-xs-12">
              <h5>Preview item</h5>
              <div className="nft__item">
                <div className="author_list_pp">
                  <a href="#">
                    {/* {
                            userData.Initials ?   <Fab size="large" color="primary" className="ml-3 font-weight-bold">
                            { userData.Initials}
                          </Fab> :  <img className="lazy" src="/img/author/author-1.jpg" alt />
                          }
                          */}
                    <img
                      className="lazy"
                      src="/img/author/author-1.jpg"
                      alt="true"
                    />
                    <i className="fa fa-check" />
                  </a>
                </div>
                <div className="nft__item_wrap">
                  <a href="#">
                    {fileUrl ? (
                      <img
                        id="get_file_2"
                        className="lazy nft__item_preview"
                        alt="true"
                        src={fileUrl}
                      />
                    ) : (
                      <img
                        src="/img/collections/coll-item-3.jpg"
                        id="get_file_2"
                        className="lazy nft__item_preview"
                        alt="image"
                      />
                    )}
                  </a>
                </div>
                <div className="nft__item_info">
                  <a href="#">
                    <h4>
                      {formInput.name == "" ? "Pinky Ocean" : formInput.name}
                    </h4>
                  </a>
                  <div className="nft__item_price">
                    {formInput.price == "" ? "0.00" : formInput.price} MATIC
                    <span>1/20</span>
                  </div>
                  <div className="nft__item_action">
                    <a href="#">Place a bid</a>
                  </div>
                  <div className="nft__item_like">
                    <i className="fa fa-heart"></i>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Create;
