/* eslint-disable @typescript-eslint/no-empty-object-type */
import {type Request, type Response, Router} from 'express';
import sanitizeHtml from 'sanitize-html';

import {TINY_MCE_SANITIZE_OPTIONS} from './sanitize-html-options';

const sanititzeRouter = Router();

sanititzeRouter.post('/html', async (req: Request<{}, {}, {html?: string}, {}>, res: Response) => {
  const {html} = req.body;
  if (!html) return void res.status(400).send('Missing html');

  const sanitizedHtml = sanitizeHtml(html, TINY_MCE_SANITIZE_OPTIONS);

  res.status(200);
  res.setHeader('Content-Type', 'application/json');

  return void res.json({
    html: sanitizedHtml,
  });
});

export default sanititzeRouter;
