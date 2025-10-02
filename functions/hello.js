exports.handler = async (event, context) => {
  console.log('Function called:', event.path);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello World!',
      method: event.httpMethod,
      path: event.path
    }),
  };
};
