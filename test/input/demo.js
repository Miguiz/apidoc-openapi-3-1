/**
 * @api {post} /test_api/:id desc_test_api
 * @apiName test_api_name
 * @apiGroup search
 *
 * @apiHeader {String} [taz] desc_taz
 *
 * @apiParam {Number} id Unique ID
 *
 * @apiParam {Number} [tar] desc_tar
 *
 * @apiParam (Body) {Object[]} foo desc_foo
 * @apiParam (Body) {String} foo.foz desc_foo.foz
 * @apiBody {String} foo.fizz desc_foo.fizz
 *
 * @apiParam (Query) {String} bar=bar desc_bar
 * @apiQuery {String} baz=baz desc_baz
 *
 * @apiParamExample {json} request_desc
 * {{extraExample}}
 * @apiSuccess {Object} data data_desc
 * @apiSuccess {number} data.keyInDoc desc_add_extra_data_key_in_doc
 *
 * @apiSuccessExample {json} response_desc
 * HTTP/1.1 200 OK
 *  {
 *      "data": {
 *          "keyInExample": 1
 *      }
 *  }
 *
 * @apiSuccessExample {json} error_desc
 * HTTP/1.1 300 OK
 * {"fooInJs":"barInJs"}
 */
