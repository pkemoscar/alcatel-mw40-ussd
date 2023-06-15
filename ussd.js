// ==UserScript==
// @name         Alcatel MW40 MIFI USSD Enhancement Userscript
// @namespace    https://github.com/pkemoscar
// @version      1.0
// @description  Enables clicking of USSD menu options
// @author       Oscar Koech
// @match        http://telenormi-fi.home/*
// @match        http://192.168.1.1/*
// @grant        none
// ==/UserScript==

(function ($) {
  //enable ussd
  window.config.MoreItemList.Ussd.isActive = true;

  //styles
  $("head").append(`
    <style type="text/css">
        .initial-ussd-selection,
        .ussd-selection{
            display:block;
            width:100%;
            min-height:25px;
            margin:3px auto;
            border-radius:10px;
            background:#4b6692;
            color:white;
        }
        .ussd-text{
            display:block;
            text-align:center;
        }
    </style>
    `);

  //poll settings
  const POLL_INTERVAL = 500; //intervals between polling for response
  const POLL_TRIES = 30; //number of times to poll for response
  let runs = 0; //number of times the poll function has run

  //this is a polling function that will keep checking for response subject to the settings above
  let poll = () => {
    let $screen = $("#showUssdResult");
    let response = $screen.text();

    //if there is no response and tries not exhausted, rerun again in set interval
    if (response.length == 0 && runs < POLL_TRIES) {
      runs++; //increment runs
      setTimeout(poll, POLL_INTERVAL);
      return;
    }
    runs = 0; //reset number of times this function has run

    //do the conversion if there is response (buttons and text)
    if (response.length > 0) {
      $screen.text(""); //clear screen
      let regex = /^([*#0-9]+)[:.]{1}(.+)/;
      response.split("\n").forEach((item) => {
        let matches = item.match(regex);
        if (matches) {
          $screen.append(
            `<button class="ussd-selection" data-selection="${matches[1]}">${matches[0]}</button>`
          );
        } else {
          $screen.append(`<span class="ussd-text">${item}</span>`);
        }
      });
    }
  };

  let getPreviousCodes = () => {
    let previous = window.localStorage.getItem("previous") ?? "";
    return previous.split(",").filter((item) => item.length);
  };

  //display initial codes
  let displayInitialCodes = () => {
    let $screen = $("#showUssdResult");
    let codes = getPreviousCodes();
    codes.forEach(function (code) {
      $screen.append(
        `<button class="initial-ussd-selection" data-selection="${code}">${code}</button>`
      );
    });
  };

  //handle submission of ussd input
  $("body").on("click", "#btnSend,#btnNext", function () {
    let $screen = $("#showUssdResult");
    let $button = $(this);

    //if initial input, save it to storage so we can use it to populate initial menu later
    if ($button.val() == "Send") {
      let input = $("#ussdIpt").val().trim();
      if (/^\*[0-9]+#$/.test(input)) {
        let codes = getPreviousCodes().filter((code) => code !== input);
        codes.unshift(input); //add the current code to the beginning of code history
        window.localStorage.setItem("previous", codes.join(","));
      }
    }

    $screen.text(""); //clear screen
    poll(); //run the polling function
  });

  //handle click on ussd selection button
  $("body").on("click", "button.ussd-selection", function () {
    $("#nextIpt").val($(this).data("selection"));
    $("#btnNext").trigger("click");
  });

  //handle click on initial ussd selection button
  $("body").on("click", "button.initial-ussd-selection", function () {
    $("#ussdIpt").val($(this).data("selection"));
    $("#btnSend").prop("disabled", false);
    $("#btnSend").trigger("click");
  });

  //show initial menu
  $("body").on("click", '#btnCancel,a[href="#more/ussdSetting.html"]', () => {
    setTimeout(displayInitialCodes, 1000);
  });
})(window.jQuery);
