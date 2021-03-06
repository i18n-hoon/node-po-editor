
	var app			= require('neasy');
	var cli 		= app.require('cli');
	var Trans 		= require('../models/trans');
	var languages 	= Trans.getLanguages();

	module.exports = {

		/***
		   * Show the current user
		   *
		   *
		   *
		   */
		index: function (req, res, next) {
			Trans.getStatus(function (err, status) {
				res.render('index.twig', {
					languages: languages,
					status: status,
					version: app.pkg.version
				});
			})
		},


		/***
		   * Show the current user
		   *
		   *
		   *
		   */
		commit: function (req, res, next) {

			Trans.getStatus(function (err, status) {
				if (status.clean == true) {
					return res.redirect('/');
				}

				Trans.createPullRequest(req.user, function (err) {
					if (err) {
						return res.end(err);
					}

					return res.redirect('/');
				})
			});
		},

		/***
		   * Show all files inside a language or redirect if there is only one
		   *
		   *
		   *
		   */
		files: function (req, res, next) {
			var files = Trans.getFiles(req.params.lang);

			if (files.length === 0) {
				return res.redirect('/');
			}

			if (files.length === 1) {
				return res.redirect('/' + req.params.lang + '/' + files[0]);
			}

			// TO DO
			return res.end('to-do: list all files');
		},

		/***
		   * Show the current user
		   *
		   *
		   *
		   */
		show: function (req, res, next) {
			var trans = new Trans({
				lang: req.params.lang,
				file: req.params.file
			});

			trans.load(function (err) {
				var filter;

				if (err) {
					cli.error('Error loading file ' + err);
					return res.end('Unknow error');
				}

				if (req.query.all) {
					filter = null;
				} else {
					filter = function (item) {
						return item.msgstr[0].length === 0;
					};
				}

				res.render('trans.twig', {
					'trans': trans.toArray({
						filter: filter
					})
				});
			});
		},


		/***
		   * Show the current user
		   *
		   *
		   *
		   */
		edit: function (req, res, next) {
			var trans, slug, string;

			trans = new Trans({
				lang: req.params.lang,
				file: req.params.file
			});

			slug = req.params.slug;

			trans.load(function (err) {
				if (err) {
					return res.end('Error: ' + err);
				}

				if (!(string = this.findSlug(slug))) {
					return res.end('Error: string not found');
				}

				res.render('string.twig', {
					'string': string
				});
			});
		},


		/***
		   * Show the current user
		   *
		   *
		   *
		   */
		update: function (req, res, next) {
			var trans, slug, string;

			trans = new Trans({
				lang: req.params.lang,
				file: req.params.file
			});

			slug = req.params.slug;

			trans.load(function (err) {
				if (err) {
					return res.end('Error: ' + err);
				}

				if (!(string = this.findSlug(slug))) {
					return res.end('Error: string not found');
				}

				trans.updateString(string, req.body.msgstr);

				trans.save(function (err) {
					if (err) {
						return res.end('Error: ' + err);
					}

					string.saved = true;

					res.render('string.twig', {
						'string': string
					});
				});
			});
		},


		/***
		   * Parse a file
		   *
		   *
		   *
		   */
		reload: function (req, res, next) {
			var trans = new Trans({
				lang: req.params.lang,
				file: req.params.file
			});

			function parse () {
				trans.parse(function (err) {
					if (err) {
						cli.error(err);
						return res.status(500).end('Error: ' + err);
					}

					return res.redirect('/' + req.params.lang + '/' + req.params.file);
				});
			};

			Trans.sync(function (err) {
				if (err) {
					console.log('sync: ', err);
					return res.end(err);
				}

				parse();
			});
		}
	};