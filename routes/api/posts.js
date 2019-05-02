const express = require('express')
const router = express.Router();
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator/check');
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const Post = require('../../models/Post')



// @ Route         POST api/post
// @ Description   Create a post request
// @ Acesss        Public

router.post('/', [auth, [
	check('text','Text is requried').not().isEmpty()
	]] , async(req,res) => {
		const errors = validationResult(req);

		if(!errors.isEmpty()){
			return res.status(400).json({errors:errors.array()})
		}

		try{
			const user = await User.findById(req.user.id).select('-password');

		const newPost = new Post({
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id,
		})
		const post = await newPost.save();

		res.json(post);

		} catch(errors){
			console.error(errors.message)
			res.status(500).send('server error')
		}

		

});



// @ Route         Get api/post
// @ Description   Get all post
// @ Acesss        Private

router.get('/',auth, async(req,res) => {

	try{
		const posts = await Post.find().sort({date: -1})
		res.json(posts)

	} catch(errors){
			console.error(errors.message)
			res.status(500).send('server error')
		}

 })

// @ Route         Get api/post.:id
// @ Description   Get post by id
// @ Acesss        Private

router.get('/:id',auth, async(req,res) => {

	try{
		const posts = await Post.findById(req.params.id)
		if(!posts){
			return res.status(404).json({msg: 'Post not found'})
		}

		res.json(posts)

	} catch(errors){
			console.error(errors.message)

			if(errors.kind === 'ObjectId'){
			return res.status(404).json({msg: 'Post not found'})
		}

			res.status(500).send('server error')
		}

 })



// @ Route         Delete api/pposts/:id
// @ Description   Get all post
// @ Acesss        Private

router.delete('/:id',auth, async(req,res) => {

	try{
		const post = await Post.findById(req.params.id)

		// Check user

		if(post.user.toString() != req.user.id){
			return res.status(401).json({msg: "User not autorized"})
		}

		if(!post){
			return res.status(404).json({msg: 'Post not found'})
		}

		await post.remove();

		res.json({msg: " Post removed "})

	} catch(errors){
			console.error(errors.message)

			if(errors.kind === 'ObjectId'){
			return res.status(404).json({msg: 'Post not found'})
		}

			res.status(500).send('server error')
		}

 })


// @ Route         Put api/like/:id
// @ Description   Like a post
// @ Acesss        Private

router.put('/like/:id', auth, async(req,res) => {
	try{
		const post = await Post.findById(req.params.id)

		// Check if the post has already been liked
		if(post.likes.filter(like => like.user.toString()=== req.user.id).length>0){
			return res.status(400).json({msg: "Post already liked"})
		}

		post.likes.unshift({user:req.user.id})
		await post.save()

		res.json(post.likes)
	}  catch(errors){
			console.error(errors.message)
			res.status(500).send('server error')
		}
})

// @ Route         Put api/unlike/:id
// @ Description   Like a post
// @ Acesss        Private

router.put('/unlike/:id', auth, async(req,res) => {
	try{
		const post = await Post.findById(req.params.id)

		// Check if the post has already been liked
		if(post.likes.filter(like => like.user.toString()=== req.user.id).length=0){
			return res.status(400).json({msg: "Post has not yet neen liked"})
		}

		// Get rmove index
		const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

		post.likes.splice(removeIndex, 1)
		await post.save()

		res.json(post.likes)
	}  catch(errors){
			console.error(errors.message)
			res.status(500).send('server error')
		}
})




// @ Route         POST api/posts/comment/:id
// @ Description   Create a post request
// @ Acesss        Public

router.post('/comment/:id', [auth, [
	check('text','Text is requried').not().isEmpty()
	]] , async(req,res) => {
		const errors = validationResult(req);

		if(!errors.isEmpty()){
			return res.status(400).json({errors:errors.array()})
		}

		try{
		const user = await User.findById(req.user.id).select('-password');
		const post = await Post.findById(req.params.id);



		const newComment = {
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id,
		}
		post.comments.unshift(newComment)
		await post.save()

		res.json(post.comments);

		} catch(errors){
			console.error(errors.message)
			res.status(500).send('server error')
		}

		

});



// @ Route         Delete api/posts/comment/:id/:comment_id
// @ Description   Delete comment
// @ Acesss        Private

router.delete('/comment/:id/:comment_id', auth, async(req,res) => {
	try{
		
	const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Get remove index
    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);

	} catch(errors){
			console.error(errors.message)
			res.status(500).send('server error')
		}
	

})





module.exports = router;