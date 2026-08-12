/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_476074106")

  // add field
  collection.fields.addAt(8, new Field({
    "help": "",
    "hidden": false,
    "id": "date2148545641",
    "max": "",
    "min": "",
    "name": "planlanan_tarih",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_476074106")

  // remove field
  collection.fields.removeById("date2148545641")

  return app.save(collection)
})
