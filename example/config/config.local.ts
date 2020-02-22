import localConfig from './config.dev';

export default () => {
  const config = localConfig();
  config.logger = {
    dir: './logs',
  };
  return config;
};
