const { Strophe, sizzle, _ } = converse.env;

export const validateUndefined = (value) => {
  if( !_.isNil(value) && (value!=='undefined') && (value!=="")){
    return  value
  }
  else {
    return null;
  }
};

// export const validateObjectForUndefinedValues = (myObject) => {
//   Object.keys(myObject).map((key, index) => {
//     myObject[key] = validateUndefined(myObject[key]);

//   });
// };

