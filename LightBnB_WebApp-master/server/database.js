const properties = require('./json/properties.json');
const users = require('./json/users.json');

//Initial setup of postgreSQL and node
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

//Log connected once connection made
console.log("connected");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  //Return promise for query
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {      
      //If result is not found inside DB, return null
      if (result.rows.length === 0) {
        return null
      };
      //If result is found, return the object for the user (not the array holding the object)
      return result.rows[0]
    })
    //Console log error if can't connect to DB
    .catch((err) => {
      console.log(err.message)
    });
}

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  //Return promise for query
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {      
      //If result is not found inside DB, return null
      if (result.rows.length === 0) {
        return null
      };
      //If result is found, return the object for the user (not the array holding the object)
      return result.rows[0]
    })
    //Console log error if can't connect to DB
    .catch((err) => {
      console.log(err.message)
    });
}

exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  //Define values
  const values = [user.name, user.email, user.password];
  //Define query (RETURNIG * returns the query object after it's inserted, as opposed to just inserting it)
  const queryString = `
    INSERT INTO users (name, email, password )
    VALUES ($1, $2, $3)
    RETURNING * 
    `;
  //Return promise for query
  return pool
  .query(queryString, values)
  .then((result) => {
    return result.rows
  })
  //Console log error if can't connect to DB
  .catch((err) => {
    console.log(err.message)
  });
}

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  //Define query
  const queryString = `
    SELECT * 
    FROM reservations
    JOIN properties ON property_id = properties.id
    WHERE guest_id = $1
    LIMIT $2
    `;
  //Return promise for query
  return pool
    .query(queryString, [guest_id, limit])
    .then((result) => {     
      //If result is not found inside DB, return null
      if (result.rows.length === 0) {
        return null
      };
      //If result is found, return results
      console.log(result.rows)
      return result.rows
    })
    //Console log error if can't connect to DB
    .catch((err) => {
      console.log(err.message)
    });
}

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */




 const getAllProperties = (options, limit = 10) => {

  // 1
  const queryParams = [];

  // 2 Initial query string common to all
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3 Add where clauses
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    const centsMinPrice = 100 * options.minimum_price_per_night;
    queryParams.push(centsMinPrice);
    queryString += ` AND cost_per_night >= $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    const centsMaxPrice = 100 * options.maximum_price_per_night
    queryParams.push(centsMaxPrice);
    queryString += ` AND cost_per_night <= $${queryParams.length}`;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += ` AND owner_id = $${queryParams.length}`;
  }

  // 4 Add finishing clauses

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating, limit);
    queryString += `
    GROUP BY properties.id
    HAVING AVG(property_reviews.rating) >= $${queryParams.length - 1}
    ORDER BY cost_per_night
    LIMIT $${queryParams.length}
    `;
  } else {
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  }

  // 5
  // console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
