const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "Please enter a store name!"
    },
    slug: String,
    description: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates"
        }
      ],
      address: {
        type: String,
        required: "You must supply an address!"
      }
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must apply an author"
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// define indexes
storeSchema.index({
  name: "text",
  description: "text"
});

storeSchema.index({
  location: "2dsphere"
});

storeSchema.pre("save", async function(next) {
  if (!this.isModified("name")) {
    next(); // skip it
    return; // stop this function!
  }
  this.slug = slug(this.name);
  // find other stores that have same slugs
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: 1 } }
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // lookup stores and populate their reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews"
      }
    },
    // filter for only items that have 2 or more reviews
    { $match: { "reviews.1": { $exists: true } } },
    // add the average reviews field
    {
      $project: {
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        phone: "$$ROOT.name",
        email: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
        averageRating: { $avg: "$reviews.rating" }
      }
    },
    // sort it highest reviews first
    { $sort: { averageRating: -1 } },
    // limit to at most 10
    { $limit: 10 }
  ]);
};

storeSchema.statics.getTopStoresByTag = function(tag) {
  return this.aggregate([
    // lookup stores and populate their reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews"
      }
    },
    // filter for only items that have 2 or more reviews
    { $match: { "tags.0": tag } },
    // add the average reviews field
    {
      $project: {
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        phone: "$$ROOT.name",
        email: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
        averageRating: { $avg: "$reviews.rating" }
      }
    },
    // sort it highest reviews first
    { $sort: { averageRating: -1 } },
    // limit to at most 10
    { $limit: 10 }
  ]);
};

storeSchema.statics.getStoreWithReviews = function(storeId) {
  return this.aggregate([
    // lookup stores and populate their reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews"
      }
    },
    // add the average reviews field
    {
      $project: {
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        phone: "$$ROOT.name",
        email: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
        averageRating: { $avg: "$reviews.rating" }
      }
    },
    { $match: { "reviews.store": storeId } }
  ]);
};

// find reviews where stores _id prop. == review's store prop.
storeSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id", // which field on store
  foreignField: "store" // which field on review
});

function autopopulate(next) {
  this.populate("reviews");
  next();
}
storeSchema.pre("find", autopopulate);
storeSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Store", storeSchema);
