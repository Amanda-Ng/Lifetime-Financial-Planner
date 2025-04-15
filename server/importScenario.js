const express = require("express");
const multer = require("multer");
const fs = require("fs");
const yaml = require("js-yaml");
const Scenario = require("./models/Scenario"); 
const Investment = require("./models/Investment");
const EventSeries = require("./models/EventSeries");

