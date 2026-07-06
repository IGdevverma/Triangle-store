class ApiFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    search() {
        if (this.queryString.keyword) {
            this.query = this.query.find({
                name: {
                    $regex: this.queryString.keyword,
                    $options: "i",
                },
            });
        }

        return this;
    }

    filter() {
        const queryObj = { ...this.queryString };

        const removeFields = ["keyword", "page", "limit", "sort"];

        removeFields.forEach((key) => delete queryObj[key]);

        this.query = this.query.find(queryObj);

        return this;
    }
    sort() {

        if (this.queryString.sort) {

            const sortBy = this.queryString.sort.split(",").join(" ");

            this.query = this.query.sort(sortBy);

        } else {

            this.query = this.query.sort("-createdAt");

        }

        return this;

    }


    pagination(resultPerPage) {
        const currentPage = Number(this.queryString.page) || 1;

        const skip = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skip);

        return this;
    }
}

module.exports = ApiFeatures;