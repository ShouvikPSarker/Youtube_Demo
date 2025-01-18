import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './Public/temp')
    },
    filename: function (req, file, cb) {
        
        cb(null, file.filename)
    }
  })
  
export const upload = multer({ storage })