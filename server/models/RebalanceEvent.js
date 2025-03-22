// Rebalance Event Schema
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const RebalanceEventSchema = new Schema({
        _id: {type: mongoose.Schema.Types.ObjectId, required: true},
        asset_allocation: {type: Map, required: true}
    },
    { timestamps: true }
)
module.exports = mongoose.model('RebalanceEvent', RebalanceEventSchema)
