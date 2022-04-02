import React from "react";

import { faArrowRight } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Footer() {
  return (
    <footer className="footer-light">
      <div className="subfooter" style={{ backgroundColor: "#ffbd58" }}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="de-flex">
                <div className="de-flex-col">
                  <a href="#">
                    <h2 className="footer-logo">
                      <img
                        src="/img/bigbullLogo.png"
                        alt="logo"
                        height={"100px"}
                      />
                    </h2>
                  </a>
                </div>
                <div className="de-flex-col">
                  <div className="social-icons">
                    <a href="#">
                      <i
                        style={{ backgroundColor: "white", color: "#ffbd58" }}
                        className="fa fa-twitter fa-lg"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
