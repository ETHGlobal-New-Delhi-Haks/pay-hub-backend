export default ({ env }) => ({
  INCH_ENDPOINT: env('INCH_ENDPOINT', ''),
  INCH_TOKEN: env('INCH_TOKEN', ''),
});
