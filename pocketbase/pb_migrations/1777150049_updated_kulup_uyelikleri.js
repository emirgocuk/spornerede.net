/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_629499490")

  // add field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "date962879552",
    "max": "",
    "min": "",
    "name": "baslangicTarihi",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "help": "",
    "hidden": false,
    "id": "date3717326503",
    "max": "",
    "min": "",
    "name": "bitisTarihi",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_629499490")

  // remove field
  collection.fields.removeById("date962879552")

  // remove field
  collection.fields.removeById("date3717326503")

  return app.save(collection)
})
