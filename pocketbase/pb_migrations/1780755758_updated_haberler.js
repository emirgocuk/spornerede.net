/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_959969506")

  // add field
  collection.fields.addAt(12, new Field({
    "help": "",
    "hidden": false,
    "id": "number3988984249",
    "max": null,
    "min": null,
    "name": "gsc_tiklama",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "help": "",
    "hidden": false,
    "id": "number761371652",
    "max": null,
    "min": null,
    "name": "gsc_gosterim",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "help": "",
    "hidden": false,
    "id": "number368530847",
    "max": null,
    "min": null,
    "name": "gsc_konum",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_959969506")

  // remove field
  collection.fields.removeById("number3988984249")

  // remove field
  collection.fields.removeById("number761371652")

  // remove field
  collection.fields.removeById("number368530847")

  return app.save(collection)
})
