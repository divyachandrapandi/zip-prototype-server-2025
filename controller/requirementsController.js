import * as dataHelper from "../helpers/dataHelper.js";

// File name (without .json)
const FILE_NAME = "requirements";

// GET all requirements for a customer
export const getRequirements = (req, res) => {
  const { customer } = req.query;

  // Load requirements.json
  const requirements = dataHelper.getData(FILE_NAME);

  // Filter by customer if provided
  let filtered = requirements;
  if (customer) {
    filtered = requirements.filter(r => r.client === customer);
  }

  res.json(filtered);
};


export const generateRequirements =async (req,res) => {

}