const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  name: 'epii avatar',
  path: {
    root: __dirname,
  },
  extern: isDev ? undefined : 'react'
};
