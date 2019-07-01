const { Strophe, sizzle, _ } = converse.env;

export const validateUndefined = (value) => {
  if( !_.isNil(value) && (value!=='undefined')){
    return  value
  }
  else {
    return null;
  }
};
