const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const { verifyAdmin } = require("../middleware/role.middleware");
const decoratorController = require("../controllers/decorator.controller");

const router = express.Router();

router.post("/become-decorator", verifyJWT, decoratorController.createRequest);
router.get(
  "/decorator-requests",
  verifyJWT,
  verifyAdmin,
  decoratorController.getAll
);

module.exports = router;
