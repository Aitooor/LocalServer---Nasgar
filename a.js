const bcrypt = require('bcrypt')

bcrypt.compare('a', '$2b$10$GAg0ACAWwAbWzxVNRZTdserd7SCZx9JQpyaVXUkMhyGnC4vpoACdK', (err, result)=>{
  console.log(result)
})