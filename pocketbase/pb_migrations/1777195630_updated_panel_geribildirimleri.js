/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3247798885")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1378298709",
    "max": 0,
    "min": 0,
    "name": "adSoyad",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "exceptDomains": null,
    "help": "",
    "hidden": false,
    "id": "email3538355597",
    "name": "kullaniciEmail",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "email"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3766721173",
    "max": 0,
    "min": 0,
    "name": "sayfaUrl",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1351553712",
    "max": 0,
    "min": 0,
    "name": "tarayiciBilgisi",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text853122659",
    "max": 0,
    "min": 0,
    "name": "gorselUrl",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2332813632",
    "max": 0,
    "min": 0,
    "name": "gorselDeleteUrl",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3247798885")

  // remove field
  collection.fields.removeById("text1378298709")

  // remove field
  collection.fields.removeById("email3538355597")

  // remove field
  collection.fields.removeById("text3766721173")

  // remove field
  collection.fields.removeById("text1351553712")

  // remove field
  collection.fields.removeById("text853122659")

  // remove field
  collection.fields.removeById("text2332813632")

  return app.save(collection)
})
