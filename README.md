## apidoc-openapi-3-1

Apidoc and swagger are two nice projects which are focusing on documentation of APIs.
This project is a middle tier which tries to bring them together in a sense that:

> It uses apidoc to convert inline documentation comments into json schema and later convert it to swagger json schema.

Uses the [apidoc-light](https://github.com/rigwild/apidoc-light) library.

## Why use it

Inspired by [apidoc-swagger-3](https://github.com/amanoooo/apidoc-swagger-3)

The old repo may not be maintained, and not support new api-doc feature

and this repo add new feature

-   **support request @apiBody @apiQuery **
-   **support response @apiSuccess/Example @apiError/Example **

## How It Works

By putting in line comments in the source code like this in javascript, you will get `swagger.json` file which can be served to [swagger-ui](https://github.com/swagger-api/swagger-ui), [y-api](https://github.com/YMFE/yapi) to generate html overview of documentation.

`/schema/demo.js`:

```js
/**
* @api {post} /test_api desc_test_api
* @apiName test_api_name
* @apiGroup search
*
* @apiHeader {String} [taz] desc_taz
*
* @apiParam {Number} [tar] desc_tar
* @apiParam (Body) {Object[]} foo desc_foo
* @apiParam (Body) {String} foo.foz desc_foo.foz
* @apiParam (Query) {String} bar=bar desc_bar
*
* @apiParamExample {json} request_desc
* {{extraExample}}
*
* @apiSuccess {Number} [code=1] desc_override_code
* @apiSuccess {Object} data data_desc
* @apiSuccess {number} data.keyInDoc desc_add_extra_data_key_in_doc
*
* @apiSuccessExample {json} response_desc
* HTTP/1.1 200 OK
*  {
   "code": 200,
    "data": {
        "keyInExample": 1
  }
}
*
* @apiSuccessExample {json} error_desc
* HTTP/1.1 300 OK
* {{fooInJs:barInJs}}
*/
```

it will output json [swagger.json](./doc/swagger.json)

## Tips

you should always use command <pre>apidoc-openapi-3-1</pre> directly, if you use <pre>npx apidoc-openapi-3-1</pre>, this lib is not able to find hook, replacing mark would be failed
