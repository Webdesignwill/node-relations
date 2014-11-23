/**
 * @author Jan Zaloudek
 * @date 27.10.13
 * @time 16:38
 * @filename
 */

var store = module.exports = require('eventflow')();
var RelationModel = require('./../models/mongoose_model.js');

store.on('init', function (options, cb) {
    cb();
});

store.on('declaration', function (cmd, cb) {
    var relation = new RelationModel({
        context: cmd.ctx.name,
        subject: cmd.subject,
        role: cmd.role,
        object: cmd.object || ""
    });

    relation.save(function(err) {
       if(err && err.code === 11000) return cb();

       return cb(err);
    });
});

store.on('revocation', function (cmd, cb) {
    RelationModel.findOneAndRemove({
        context: cmd.ctx.name,
        subject: cmd.subject,
        role: cmd.role,
        object: cmd.object
    }, cb);
});

store.on('verb-question', function (cmd, cb) {
    console.log('verb-question');
    RelationModel.findOne({
        context: cmd.ctx.name,
        subject: cmd.subject,
        role: { $in: cmd.ctx.verbs[cmd.verb] },
        $or: [{
                object: cmd.object || "",
            },
            {
                object: ''
            }]
    }, function(err, relation) {
        if(err) return cb(err);

        if(relation) {
            return cb(null, true);
        }

        cb(null, false);
    });
});

store.on('role-question', function (cmd, cb) {
    console.log('role-question');
    RelationModel.findOne({
        context: cmd.ctx.name,
        subject: cmd.subject,
        role: cmd.role,
        $or: [{
            object: cmd.object || "",
        },
            {
                object: ''
            }]
    }, function(err, relation) {
        if(err) {
            return cb(err);
        }

        if(relation) {
            return cb(null, true);
        }

        cb(null, false);
    });
});

store.on('verb-request', function (cmd, cb) {
    console.log('verb-request');
    RelationModel.find({
        context: cmd.ctx.name,
        subject: cmd.subject,
        role: cmd.ctx.verbs[cmd.verb],
        object: { $ne: '' }
    }, 'object', function(err, relations) {
        if(err) return cb(err);

        cb(null, relation.map(function(relation) { return relation.object; }));
    });
});

store.on('role-request', function (cmd, cb) {
    console.log('role-request');
    RelationModel.find({
        context: cmd.ctx.name,
        subject: cmd.subject,
        role: cmd.role,
        object: { $ne: '' }
    }, 'object', function(err, relations) {
        if(err) return cb(err);

        cb(null, relations.map(function(relation) { return relation.object; }));
    });
});

store.on('verb-subject-request', function (cmd, cb) {
    console.log('verb-subject-request');
    RelationModel.find({
        context: cmd.ctx.name,
        object: cmd.object,
        role: { $in: cmd.ctx.verbs[cmd.verb] }
    }, 'subject', function(err, relations) {
        if(err) return cb(err);

        cb(null, relations.map(function(relation) { return relation.subject; }));
    });
});

store.on('role-subject-request', function (cmd, cb) {
    console.log('role-subject-request');
    RelationModel.find({
        context: cmd.ctx.name,
        object: cmd.object,
        role: cmd.role
    }, 'subject', function(err, relations) {
        if(err) return cb(err);

        cb(null, relations.map(function(relation) { return relation.subject; }));
    });
});

store.on('object-verb-request', function (cmd, cb) {
    console.log('object-verb-request');
    RelationModel.find({
        context: cmd.ctx.name,
        object: cmd.object,
        subject: cmd.subject
    }, 'role', function(err, relations) {
        if(err) return cb(err);

        cb(null, relations.reduce(function (verbs, row) {
            return verbs.concat( cmd.ctx.roles[row.role] || [] );
        }, []));
    });
});

// TODO
store.on('object-role-map-request', function (cmd, cb) {
    console.log('object-role-map-request');
  // var subject = initSubject(cmd);
  // var map = {};
  // map[''] = Object.keys(subject.roles || {}).filter(function (role) {
  //   return subject.roles[role];
  // });
  // cb(null, Object.keys(subject.objects || {}).reduce(function (map, object) {
  //   var roles = Object.keys(subject.objects[object] || {}).filter(function (role) {
  //     return subject.objects[object][role];
  //   });
  //   if (roles.length) map[object] = roles;
  //   return map;
  // }, map));
});

store.on('subject-role-map-request', function (cmd, cb) {
    console.log('subject-role-map-request');
  // var subjects = Object.keys(contexts[cmd.ctx.name] || {});
  // cb(null, subjects.reduce(function (map, subjectName) {
  //   var subject = initSubject({ subject: subjectName, ctx: cmd.ctx })
  //     , roles;
  //   if (cmd.object) {
  //     var object = (subject.objects || {})[cmd.object] || {};
  //     roles = Object.keys(object).filter(function (role) {
  //       return object[role];
  //     });
  //   }
  //   else {
  //     roles = Object.keys(subject.roles || {}).filter(function (role) {
  //       return subject.roles[role];
  //     });
  //   }
  //   if (roles.length) map[subjectName] = roles;
  //   return map;
  // }, {}));
});

store.on('reset', function (cb) {
    RelationModel.remove({}, cb);
});