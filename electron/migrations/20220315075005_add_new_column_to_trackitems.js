
exports.up = function(knex) {
  return knex.schema.table('TrackItems', table => {
    table.integer('entityId');
    table.string('entityType');
    table.integer('projectId');
    table.string('clientId');
  })
};

exports.down = function(knex) {
  return knex.schema.table('TrackItems', table => {
    table.dropColumn('entityId');
    table.dropColumn('entityType');
    table.dropColumn('projectId');
    table.dropColumn('clientId');
  })
};
