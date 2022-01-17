const { MongoClient } = require('mongodb');
require('dotenv').config()

async function main() {
    const uri = process.env.MONGODB

    const client = new MongoClient(uri);

    try {
        await client.connect();

        await updateAllListingsToHavePropertyType(client);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);

async function updateAllListingsToHavePropertyType(client) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").updateMany({ property_type: { $exists: false } }, { $set: { property_type: "Unknown" } });

    console.log(`${result.matchedCount} document(s) matched the query criteria.`);

    console.log(`${result.modifiedCount} document(s) was/were updated.`);
}

async function upsertListingByName(client, nameOfLisiting, updatedListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").updateOne({ name: nameOfLisiting }, { $set: updatedListing }, { upsert: true });

    console.log(` ${result.matchedCount} document(s) matched the query criteria`);

    if (result.upsertedCount > 0) {
        console.log(`One document was inserted with the id ${result.upsertedId}`);
    } else {
        console.log(`${result.modifiedCount} document(s) was/were updated`)
    }
}

async function updateListingsByName(client, nameOfLisiting, updatedListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").updateOne({ name: nameOfLisiting }, { $set: updatedListing })

    console.log(`${result.matchedCount} document(s) matched query criteria`)
    console.log(`${result.modifiedCount} document(s) was/were updated`)
}

async function findLisitngsWithMinimumBedroomsAndMostRecentReviews(client, {
    minimumNumberOfBedrooms = 0,
    minimumNumberOfBathooms = 0,
    maximumNumberOfResults = Number.MAX_SAFE_INTEGER
} = {}) {
    const cursor = await client.db("sample_airbnb").collection("listingsAndReviews").find({
        bedrooms: { $gte: minimumNumberOfBedrooms },
        bathrooms: { $gte: minimumNumberOfBedrooms }
    }).sort({ last_review: -1 }).limit(maximumNumberOfResults);

    const results = await cursor.toArray();

    if (results.length > 0) {
        console.log(`Found lisitngs(s) with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathooms} bathrooms:`);
        results.forEach((result, i) => {
            date = new Date(result.last_review).toDateString();
            console.log();
            console.log(`${i + 1}. name: ${result.name}`);
            console.log(` _id: ${result._id}`);
            console.log(` bedrooms: ${result.bedrooms}`);
            console.log(` bathrooms: ${result.bathrooms}`);
            console.log(` most recent review date: ${new Date(result.last_review).toDateString()}`);
        });

    } else {
        console.log(`No lisitings found with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathooms} bathrooms`)
    }

    async function findOneListingByName(client, nameOfLisiting) {
        const result = await client.db("sample_airbnb").collection("listingsAndReviews").findOne({ name: nameOfLisiting });

        if (result) {
            console.log(`Found a lisiting in the collection with the name: '${nameOfLisiting}' `);
            console.log(result);

        } else {
            console.log(`No lisitings found with the name '${nameOfLisiting}'`);
        }
    }
}

async function createMultipleListings(client, newListings) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertMany(newListings);

    console.log(` ${result.insertedCount} new lisitngs created with the following id(s):`);
    console.log(result.insertedIds);
}


async function createListing(client, newListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").insertOne(newListing);

    console.log(`New lisitng created with the following id: ${result.insertedId}`);
}

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`);

    })
}