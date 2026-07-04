const Machinery = require("../models/Machinery");

const addMachine = async (req, res) => {
  try {
    const machine = await Machinery.create(req.body);

    res.status(201).json(machine);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMachines = async (req, res) => {
  try {
    const machines = await Machinery.find();

    res.json(machines);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addMachine,
  getMachines,
};
