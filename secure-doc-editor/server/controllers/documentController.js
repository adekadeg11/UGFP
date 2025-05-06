const Document = require('../models/Document');

exports.createDocument = (req, res) => {
  const { title, encryptedContent } = req.body;
  const document = Document.create(title, encryptedContent, req.user.id);
  res.status(201).json({ document });
};

exports.updateDocument = (req, res) => {
  const document = Document.findById(req.params.id);
  if (!document || !document.hasPermission(req.user.id, 'write')) return res.status(403).json({ message: 'Forbidden' });
  const { encryptedContent } = req.body;
  document.ipfsCid = encryptedContent;
  res.json({ document });
};

exports.getDocument = (req, res) => {
  const document = Document.findById(req.params.id);
  if (!document || !document.hasPermission(req.user.id, 'read')) return res.status(403).json({ message: 'Forbidden' });
  res.json(document.getMetadataFor(req.user.id));
};

exports.createBranch = (req, res) => {
  const document = Document.findById(req.params.id);
  if (!document || !document.hasPermission(req.user.id, 'write')) return res.status(403).json({ message: 'Forbidden' });
  const { name, fromVersion } = req.body;
  const branch = document.createBranch(name, fromVersion);
  res.json(branch);
};

exports.switchBranch = (req, res) => {
  const document = Document.findById(req.params.id);
  if (!document || !document.hasPermission(req.user.id, 'read')) return res.status(403).json({ message: 'Forbidden' });
  const { name } = req.body;
  const version = document.switchBranch(name);
  res.json({ version });
};

exports.mergeBranch = (req, res) => {
  // Simple simulation of a merge: just bring content from one branch into master
  const document = Document.findById(req.params.id);
  if (!document || !document.hasPermission(req.user.id, 'write')) return res.status(403).json({ message: 'Forbidden' });
  const { fromBranch } = req.body;
  const headId = document.branches[fromBranch].head;
  const headVersion = document.versions.find(v => v.id === headId);
  document.addVersion(headVersion.ipfsCid, req.user.id, `Merged from ${fromBranch}`);
  res.json({ merged: true });
};

exports.addCollaborator = (req, res) => {
  const document = Document.findById(req.params.id);
  if (!document || !document.hasPermission(req.user.id, 'admin')) return res.status(403).json({ message: 'Forbidden' });
  const { collaboratorId, permissions } = req.body;
  document.addCollaborator(collaboratorId, permissions);
  res.json({ message: 'Collaborator added' });
};
