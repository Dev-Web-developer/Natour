class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => {
      delete queryObj[el];
    });

    //Advanced filtering
    //convert "gte" on url to $gte
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryString));
    return this; //which return entire obj
  }

  sort() {
    if (this.queryString.sort) {
      //if there is tie in price then just add "," in url and add another fiel like ratingAverage which will pass as :- sort('price ratingAverage')
      const adQuery = this.queryString.sort.replace(/,/g, ' ');
      this.query = this.query.sort(adQuery);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.replace(/,/g, ' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    //conveting page sting to int ane setting default value 1
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //page=2&limit=10 ie we wand second page so first page data need to be skip and secong 10 data is need to be displayed
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
