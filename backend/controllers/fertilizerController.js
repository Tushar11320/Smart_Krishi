const Fertilizer = require(
  "../models/Fertilizer"
);

const addProduct = async (req, res) => {
  try {
    const product =
      await Fertilizer.create({
        ...req.body,
        image: req.file
          ? req.file.filename
          : "",
      });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products =
      await Fertilizer.find();

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addProduct,
  getProducts,
};